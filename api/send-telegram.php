<?php

declare(strict_types=1);

@ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$root = dirname(__DIR__);
loadEnv($root . '/.env');

$token = getenv('TELEGRAM_BOT_TOKEN') ?: ($_ENV['TELEGRAM_BOT_TOKEN'] ?? '');
$chatId = getenv('TELEGRAM_CHAT_ID') ?: ($_ENV['TELEGRAM_CHAT_ID'] ?? '');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || !isset($data['source'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($token === '' || $chatId === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'telegram_not_configured'], JSON_UNESCAPED_UNICODE);
    exit;
}

$source = (string) $data['source'];
$payload = isset($data['payload']) && is_array($data['payload']) ? $data['payload'] : [];
$clientMeta = normalizeClientMeta($data['meta'] ?? null);
$serverMeta = collectServerMeta();

$text = buildMessage($source, $payload, $clientMeta, $serverMeta);
if ($text === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_message'], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = telegramSendMessage($token, $chatId, $text);

if (!$result['ok']) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'telegram_error'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

function loadEnv(string $path): void
{
    if (!is_readable($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, '=') === false) {
            continue;
        }
        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        $len = strlen($value);
        if ($len >= 2 && (
            ($value[0] === '"' && substr($value, -1) === '"') ||
            ($value[0] === "'" && substr($value, -1) === "'")
        )) {
            $value = stripcslashes(substr($value, 1, -1));
        }
        putenv("{$name}={$value}");
        $_ENV[$name] = $value;
    }
}

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5 | ENT_SUBSTITUTE, 'UTF-8');
}

function buildMessage(string $source, array $p, array $clientMeta, array $serverMeta): string
{
    $lines = [];
    switch ($source) {
        case 'quiz':
            $lines[] = '<b>Квиз AutoBridge</b>';
            $lines[] = '';
            $lines[] = '<b>Имя:</b> ' . esc((string) ($p['name'] ?? ''));
            $lines[] = '<b>Телефон:</b> ' . esc((string) ($p['phone'] ?? ''));
            $lines[] = '';
            $lines[] = '<b>Ответы:</b>';
            $answers = str_replace(["\r\n", "\r"], "\n", (string) ($p['answers'] ?? ''));
            $lines[] = $answers !== '' ? '<pre>' . esc($answers) . '</pre>' : '—';
            break;

        case 'consult':
            $lines[] = '<b>Консультация (форма на сайте)</b>';
            $lines[] = '';
            $lines[] = '<b>Имя:</b> ' . esc((string) ($p['name'] ?? ''));
            $lines[] = '<b>Телефон:</b> ' . esc((string) ($p['phone'] ?? ''));
            $lines[] = '<b>Email:</b> ' . esc((string) ($p['email'] ?? ''));
            break;

        case 'catalog_modal':
            $lines[] = '<b>Быстрая консультация (модалка каталога)</b>';
            $lines[] = '';
            $lines[] = '<b>Имя:</b> ' . esc((string) ($p['name'] ?? ''));
            $lines[] = '<b>Телефон:</b> ' . esc((string) ($p['phone'] ?? ''));
            break;

        case 'quick_call':
            $lines[] = '<b>Быстрый звонок</b>';
            $lines[] = '';
            $lines[] = '<b>Имя:</b> ' . esc((string) ($p['name'] ?? ''));
            $lines[] = '<b>Телефон:</b> ' . esc((string) ($p['phone'] ?? ''));
            break;

        default:
            return '';
    }

    $metaBlock = buildMetaPreBlock($clientMeta, $serverMeta);
    if ($metaBlock !== '') {
        $lines[] = '';
        $lines[] = '<b>────────── Технические данные ──────────</b>';
        $lines[] = '<pre>' . esc($metaBlock) . '</pre>';
    }

    $full = implode("\n", $lines);
    if (strlen($full) > 4000) {
        $full = function_exists('mb_substr')
            ? mb_substr($full, 0, 3990, 'UTF-8') . '…'
            : substr($full, 0, 3990) . '…';
    }

    return $full;
}

function normalizeClientMeta(mixed $meta): array
{
    if (!is_array($meta)) {
        return [];
    }
    $out = [];
    foreach ($meta as $k => $v) {
        if (!is_string($k) || $k === '') {
            continue;
        }
        if (is_bool($v)) {
            $out[$k] = $v ? 'да' : 'нет';
        } elseif (is_scalar($v)) {
            $s = (string) $v;
            $s = str_replace(["\0", "\r"], '', $s);
            if (strlen($s) > 800) {
                $s = (function_exists('mb_substr')
                    ? mb_substr($s, 0, 800, 'UTF-8')
                    : substr($s, 0, 800)) . '…';
            }
            $out[$k] = $s;
        }
    }

    return $out;
}

function collectServerMeta(): array
{
    $s = static function (string $key): string {
        $v = $_SERVER[$key] ?? '';

        return is_string($v) ? trim($v) : '';
    };

    return [
        'ip' => $s('REMOTE_ADDR'),
        'x_forwarded_for' => $s('HTTP_X_FORWARDED_FOR'),
        'x_real_ip' => $s('HTTP_X_REAL_IP'),
        'cf_connecting_ip' => $s('HTTP_CF_CONNECTING_IP'),
        'true_client_ip' => $s('HTTP_TRUE_CLIENT_IP'),
        'user_agent_http' => $s('HTTP_USER_AGENT'),
        'accept_language' => $s('HTTP_ACCEPT_LANGUAGE'),
        'referer_http' => $s('HTTP_REFERER'),
        'origin_http' => $s('HTTP_ORIGIN'),
        'request_method' => $s('REQUEST_METHOD'),
        'php_host' => $s('HTTP_HOST'),
    ];
}

function buildMetaPreBlock(array $client, array $server): string
{
    $label = static function (string $key): string {
        static $map = [
            'ip' => 'IP (сервер, REMOTE_ADDR)',
            'x_forwarded_for' => 'X-Forwarded-For',
            'x_real_ip' => 'X-Real-IP',
            'cf_connecting_ip' => 'CF-Connecting-IP',
            'true_client_ip' => 'True-Client-IP',
            'user_agent_http' => 'User-Agent (HTTP-запрос)',
            'accept_language' => 'Accept-Language',
            'referer_http' => 'Referer (заголовок запроса)',
            'origin_http' => 'Origin',
            'request_method' => 'Метод запроса',
            'php_host' => 'Host',
            'page_url' => 'Страница отправки',
            'referrer' => 'document.referrer',
            'tz' => 'Часовой пояс',
            'lang' => 'Язык браузера',
            'languages' => 'Список языков',
            'platform' => 'navigator.platform',
            'vendor' => 'Vendor браузера',
            'ua_client' => 'User-Agent (navigator)',
            'screen' => 'Экран (ширина×высота)',
            'avail_screen' => 'Доступная область экрана',
            'color_depth' => 'Глубина цвета',
            'pixel_ratio' => 'devicePixelRatio',
            'viewport' => 'Viewport окна',
            'touch_points' => 'maxTouchPoints',
            'cores' => 'Ядер CPU (hardwareConcurrency)',
            'device_memory_gb' => 'RAM устройства (ГБ, прибл.)',
            'online' => 'Онлайн',
            'cookies' => 'Cookies включены',
            'conn_type' => 'Тип сети (effectiveType)',
            'conn_downlink' => 'Скорость сети (downlink)',
            'ua_mobile' => 'Client Hints: mobile',
            'ua_brands' => 'Client Hints: brands',
            'hint_model' => 'Модель устройства (Client Hints)',
            'hint_platform' => 'Платформа ОС (Client Hints)',
            'hint_platform_version' => 'Версия ОС (Client Hints)',
            'hint_arch' => 'Архитектура',
            'hint_bitness' => 'Разрядность',
            'hint_full_versions' => 'Полные версии (Client Hints)',
        ];

        return $map[$key] ?? $key;
    };

    $rows = [];

    $serverOrder = [
        'ip', 'x_forwarded_for', 'x_real_ip', 'cf_connecting_ip', 'true_client_ip',
        'user_agent_http', 'accept_language', 'referer_http', 'origin_http',
        'request_method', 'php_host',
    ];
    foreach ($serverOrder as $k) {
        if (!isset($server[$k])) {
            continue;
        }
        $v = trim((string) $server[$k]);
        if ($v === '' && in_array($k, ['x_forwarded_for', 'x_real_ip', 'cf_connecting_ip', 'true_client_ip', 'referer_http', 'origin_http'], true)) {
            continue;
        }
        $rows[] = $label($k) . ': ' . ($v !== '' ? $v : '—');
    }

    $clientOrder = [
        'page_url', 'referrer', 'tz', 'lang', 'languages', 'platform', 'vendor',
        'ua_client', 'screen', 'avail_screen', 'color_depth', 'pixel_ratio', 'viewport',
        'touch_points', 'cores', 'device_memory_gb', 'online', 'cookies',
        'conn_type', 'conn_downlink', 'ua_mobile', 'ua_brands',
        'hint_model', 'hint_platform', 'hint_platform_version', 'hint_arch', 'hint_bitness', 'hint_full_versions',
    ];
    $used = [];
    foreach ($clientOrder as $k) {
        if (!isset($client[$k])) {
            continue;
        }
        $used[$k] = true;
        $v = trim((string) $client[$k]);
        $rows[] = $label($k) . ': ' . ($v !== '' ? $v : '—');
    }
    foreach ($client as $k => $v) {
        if (isset($used[$k])) {
            continue;
        }
        $v = trim((string) $v);
        $rows[] = $label($k) . ': ' . ($v !== '' ? $v : '—');
    }

    return implode("\n", $rows);
}

function telegramSendMessage(string $token, string $chatId, string $text): array
{
    $url = 'https://api.telegram.org/bot' . rawurlencode($token) . '/sendMessage';
    $body = json_encode([
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE);

    if ($body === false) {
        return ['ok' => false, 'error' => 'encode_failed'];
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $res = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($res === false) {
            return ['ok' => false, 'error' => 'curl_failed'];
        }
        $json = json_decode($res, true);
        if ($code >= 200 && $code < 300 && is_array($json) && !empty($json['ok'])) {
            return ['ok' => true];
        }
        $desc = is_array($json) ? ($json['description'] ?? '') : '';
        return ['ok' => false, 'error' => $desc !== '' ? $desc : 'telegram_http_' . $code];
    }

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json; charset=utf-8\r\n",
            'content' => $body,
            'timeout' => 15,
        ],
    ]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) {
        return ['ok' => false, 'error' => 'http_failed'];
    }
    $json = json_decode($res, true);
    if (is_array($json) && !empty($json['ok'])) {
        return ['ok' => true];
    }
    $desc = is_array($json) ? ($json['description'] ?? '') : '';
    return ['ok' => false, 'error' => $desc !== '' ? $desc : 'telegram_bad_response'];
}
