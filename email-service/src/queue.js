const crypto = require("crypto");
const { config } = require("./config");
const { sendEmail } = require("./mailer");

const pending = [];
const completed = [];
const failed = [];
const jobs = new Map();

let active = 0;
let started = false;

function trim(list, max) {
  while (list.length > max) {
    const removed = list.shift();
    if (removed?.id) jobs.delete(removed.id);
  }
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    lastError: job.lastError || null,
    result: job.result || null,
  };
}

function stats() {
  return {
    enabled: config.queue.enabled,
    started,
    concurrency: config.queue.concurrency,
    maxSize: config.queue.maxSize,
    pending: pending.length,
    active,
    completed: completed.length,
    failed: failed.length,
    knownJobs: jobs.size,
  };
}

function getJob(id) {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
}

function startQueue() {
  started = true;
  process.nextTick(drainQueue);
}

function enqueueEmail(message, options = {}) {
  if (pending.length + active >= config.queue.maxSize) {
    return {
      error: true,
      status: "rejected",
      msg: "Email queue is full",
      queue: stats(),
    };
  }

  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    message,
    status: "queued",
    attempts: 0,
    maxAttempts: options.retries ?? config.queue.retries,
    createdAt: now,
    updatedAt: now,
    lastError: null,
    result: null,
  };

  pending.push(job);
  jobs.set(job.id, job);
  if (started) drainQueue();

  return {
    error: false,
    status: "queued",
    jobId: job.id,
    queue: stats(),
  };
}

function enqueueMany(messages = []) {
  const accepted = [];
  const rejected = [];

  for (const message of messages) {
    const result = enqueueEmail(message);
    if (result.error) rejected.push({ message, result });
    else accepted.push(result);
  }

  return {
    error: rejected.length > 0,
    status: rejected.length > 0 ? "partial" : "queued",
    accepted,
    rejected,
    queue: stats(),
  };
}

function scheduleRetry(job) {
  job.status = "retrying";
  job.updatedAt = new Date().toISOString();
  setTimeout(() => {
    job.status = "queued";
    job.updatedAt = new Date().toISOString();
    pending.push(job);
    drainQueue();
  }, config.queue.retryDelayMs * job.attempts);
}

async function runJob(job) {
  active += 1;
  job.status = "active";
  job.attempts += 1;
  job.updatedAt = new Date().toISOString();

  try {
    const result = await sendEmail(job.message);
    if (result.error) {
      throw new Error(result.msg || "Email provider failed");
    }

    job.status = "completed";
    job.result = result;
    job.updatedAt = new Date().toISOString();
    completed.push(publicJob(job));
    trim(completed, config.queue.keepCompleted);
  } catch (error) {
    job.lastError = error.message;
    job.updatedAt = new Date().toISOString();

    if (job.attempts <= job.maxAttempts) {
      scheduleRetry(job);
    } else {
      job.status = "failed";
      failed.push(publicJob(job));
      trim(failed, config.queue.keepFailed);
    }
  } finally {
    active -= 1;
    drainQueue();
  }
}

function drainQueue() {
  if (!started) return;
  while (active < config.queue.concurrency && pending.length > 0) {
    const job = pending.shift();
    runJob(job);
  }
}

if (config.queue.enabled && config.queue.autostart) {
  startQueue();
}

module.exports = {
  enqueueEmail,
  enqueueMany,
  getJob,
  startQueue,
  stats,
};
