<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

echo json_encode([
    'ok' => true,
    'name' => 'Sistema ECORP Online',
    'runtime' => 'locaweb-php'
], JSON_UNESCAPED_UNICODE);
