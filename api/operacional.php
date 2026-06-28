<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($method !== 'GET' && $method !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo nao permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$rootDir = dirname(__DIR__);
$dataDir = $rootDir . DIRECTORY_SEPARATOR . 'data';
$dbFile = $dataDir . DIRECTORY_SEPARATOR . 'ecorp-operacional.json';
$maxBodySize = 30 * 1024 * 1024;

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

if ($method === 'GET') {
    if (!is_file($dbFile)) {
        echo '{}';
        exit;
    }

    $content = file_get_contents($dbFile);
    echo $content !== false && trim($content) !== '' ? $content : '{}';
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Nao foi possivel ler os dados enviados.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($raw) > $maxBodySize) {
    http_response_code(413);
    echo json_encode(['error' => 'Arquivo/dados maiores que o limite permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if ($encoded === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Nao foi possivel serializar o banco.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$tmpFile = $dbFile . '.tmp';
$written = file_put_contents($tmpFile, $encoded, LOCK_EX);
if ($written === false || !rename($tmpFile, $dbFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Nao foi possivel salvar o banco na hospedagem.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'savedAt' => gmdate('c')], JSON_UNESCAPED_UNICODE);
