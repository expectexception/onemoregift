const test = require("node:test");
const assert = require("node:assert/strict");

const { TEMPLATE_NAMES, renderTemplate, renderTextTemplate } = require("../src/templates");

test("otp template renders branded one-time code", () => {
  const html = renderTemplate("otp", {
    code: "123456",
    title: "Verify Your Email",
    message: "Use this code to continue.",
  });

  assert.match(html, /OneMore/);
  assert.match(html, /123456/);
  assert.match(html, /Verify Your Email/);
  assert.match(html, /Do not share this code/);
});

test("template theme can be overridden per app", () => {
  const html = renderTemplate("welcome", {
    message: "Your workspace is ready.",
    theme: {
      appName: "SecondApp",
      appUrl: "https://second.example",
      supportEmail: "help@second.example",
      primaryColor: "#2563eb",
      accentColor: "#14b8a6",
    },
  });

  assert.match(html, /SecondApp/);
  assert.match(html, /https:\/\/second\.example/);
  assert.match(html, /help@second\.example/);
  assert.match(html, /#2563eb/);
});

test("winner template renders prize details", () => {
  const html = renderTemplate("winner", {
    prize: "Gift Card",
    giveaway: "Daily Rewards",
  });

  assert.match(html, /Gift Card/);
  assert.match(html, /Daily Rewards/);
});

test("template list and text fallback stay available", () => {
  assert.ok(TEMPLATE_NAMES.includes("notification"));
  const text = renderTextTemplate("notification", {
    title: "Password Updated",
    message: "Your password changed.",
  });

  assert.match(text, /Password Updated/);
  assert.match(text, /Your password changed/);
});
