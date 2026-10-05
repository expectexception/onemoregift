<?php
// Contact form handler: emails the visitor's query to info@topfurnitures.in.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /Contact%20us.html');
    exit;
}

// Newlines in the name could inject extra mail headers; flatten them.
$name  = trim(str_replace(["\r", "\n"], ' ', $_POST['name'] ?? ''));
$email = trim($_POST['email'] ?? '');
$query = trim($_POST['query'] ?? '');

if ($name === '' || $query === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($name) > 200 || strlen($query) > 5000) {
    $ok  = false;
    $msg = 'Please enter your name, a valid email address and your query.';
} else {
    $headers  = "From: info@topfurnitures.in\r\n";
    $headers .= "Reply-To: $email\r\n";   // validated above, so no header injection
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $ok  = mail('info@topfurnitures.in', 'Query - Contact Us Page', "$name\n$email\n\n$query", $headers);
    $msg = $ok ? 'Request sent successfully' : 'Sorry, your request could not be sent. Please call us instead.';
}

$next = $ok ? '/' : '/Contact%20us.html';
echo '<script>alert(' . json_encode($msg) . ');</script>';
echo '<meta http-equiv="refresh" content="0; url=' . $next . '">';
exit;
