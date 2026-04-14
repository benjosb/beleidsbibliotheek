<?php
/**
 * BeleidsBibliotheek — eerste-partij statistiek (productie)
 * Geen cookies, geen externe trackers. Alleen deze origin + server-side opslag.
 *
 * - weergaven: elke geldige paginalading (GET)
 * - uniek (dag / totaal): distincte gehashte bezoeker (sha256 van zout + IP + UA)
 * - bezoeken (sessies): nieuwe sessie na 30 min inactiviteit of eerste hit op een kalenderdag
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

const SESSION_GAP = 1800; // 30 minuten

function out(array $a): void
{
    echo json_encode($a, JSON_UNESCAPED_UNICODE);
    exit;
}

function client_ip(): string
{
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return trim((string) $_SERVER['HTTP_CF_CONNECTING_IP']);
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return trim((string) $_SERVER['HTTP_X_REAL_IP']);
    }
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function likely_bot(string $ua): bool
{
    if ($ua === '') {
        return false;
    }
    return (bool) preg_match(
        '/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|scanner|wget|curl\\/\\d|python-requests|java\\//i',
        $ua
    );
}

$dataDir = __DIR__ . '/data';
$saltFile = $dataDir . '/.salt';
$dbPath = $dataDir . '/stats.sqlite';

if (!is_dir($dataDir)) {
    if (!@mkdir($dataDir, 0755, true)) {
        out(['ok' => false, 'error' => 'data_dir']);
    }
}

if (!is_readable($saltFile)) {
    $salt = bin2hex(random_bytes(32));
    @file_put_contents($saltFile, $salt, LOCK_EX);
}
$salt = (string) @file_get_contents($saltFile);
if ($salt === '') {
    $salt = bin2hex(random_bytes(32));
    @file_put_contents($saltFile, $salt, LOCK_EX);
}

$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
$ip = client_ip();
$visitorHash = hash('sha256', $salt . "\0" . $ip . "\0" . $ua);

$skipCount = likely_bot($ua);

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec('PRAGMA journal_mode=WAL;');
} catch (Throwable $e) {
    out(['ok' => false, 'error' => 'db']);
}

$pdo->exec('CREATE TABLE IF NOT EXISTS visitors (
    hash TEXT PRIMARY KEY,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS day_stats (
    day TEXT PRIMARY KEY,
    weergaven INTEGER NOT NULL DEFAULT 0,
    bezoeken INTEGER NOT NULL DEFAULT 0,
    uniek INTEGER NOT NULL DEFAULT 0
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS day_visitor (
    day TEXT NOT NULL,
    hash TEXT NOT NULL,
    PRIMARY KEY (day, hash)
)');

$now = time();
$tzNl = new DateTimeZone('Europe/Amsterdam');
$dtNu = new DateTimeImmutable('@' . $now);
$dtNu = $dtNu->setTimezone($tzNl);
$day = $dtNu->format('Y-m-d');
$todayStart = (new DateTimeImmutable($day . ' 00:00:00', $tzNl))->getTimestamp();

$rowSinds = $pdo->query("SELECT value FROM counters WHERE name = 'sinds'")->fetch(PDO::FETCH_ASSOC);
if (!$rowSinds) {
    $pdo->prepare('INSERT INTO counters (name, value) VALUES (?, ?)')->execute(['sinds', $now]);
    $st = $pdo->prepare('INSERT INTO counters (name, value) VALUES (?, ?)');
    $st->execute(['weergaven', 0]);
    $st->execute(['bezoeken', 0]);
}

if (!$skipCount) {
    $pdo->beginTransaction();
    try {
        $stSel = $pdo->prepare('SELECT last_seen FROM visitors WHERE hash = ?');
        $stSel->execute([$visitorHash]);
        $ex = $stSel->fetch(PDO::FETCH_ASSOC);

        $pdo->prepare('INSERT OR IGNORE INTO day_stats (day, weergaven, bezoeken, uniek) VALUES (?, 0, 0, 0)')->execute([$day]);

        $pdo->prepare('UPDATE counters SET value = value + 1 WHERE name = ?')->execute(['weergaven']);
        $pdo->prepare('UPDATE day_stats SET weergaven = weergaven + 1 WHERE day = ?')->execute([$day]);

        if (!$ex) {
            $pdo->prepare('INSERT INTO visitors (hash, first_seen, last_seen) VALUES (?, ?, ?)')
                ->execute([$visitorHash, $now, $now]);
            $pdo->prepare('UPDATE counters SET value = value + 1 WHERE name = ?')->execute(['bezoeken']);
            $pdo->prepare('UPDATE day_stats SET bezoeken = bezoeken + 1 WHERE day = ?')->execute([$day]);

            $insD = $pdo->prepare('INSERT OR IGNORE INTO day_visitor (day, hash) VALUES (?, ?)');
            $insD->execute([$day, $visitorHash]);
            if ($insD->rowCount() > 0) {
                $pdo->prepare('UPDATE day_stats SET uniek = uniek + 1 WHERE day = ?')->execute([$day]);
            }
        } else {
            $last = (int) $ex['last_seen'];
            $newSession = ($last < $todayStart) || (($now - $last) > SESSION_GAP);
            $pdo->prepare('UPDATE visitors SET last_seen = ? WHERE hash = ?')->execute([$now, $visitorHash]);

            $insD = $pdo->prepare('INSERT OR IGNORE INTO day_visitor (day, hash) VALUES (?, ?)');
            $insD->execute([$day, $visitorHash]);
            if ($insD->rowCount() > 0) {
                $pdo->prepare('UPDATE day_stats SET uniek = uniek + 1 WHERE day = ?')->execute([$day]);
            }

            if ($newSession) {
                $pdo->prepare('UPDATE counters SET value = value + 1 WHERE name = ?')->execute(['bezoeken']);
                $pdo->prepare('UPDATE day_stats SET bezoeken = bezoeken + 1 WHERE day = ?')->execute([$day]);
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        out(['ok' => false, 'error' => 'tx']);
    }
}

$totWeergaven = (int) $pdo->query("SELECT value FROM counters WHERE name = 'weergaven'")->fetchColumn();
$totBezoeken = (int) $pdo->query("SELECT value FROM counters WHERE name = 'bezoeken'")->fetchColumn();
$totUniek = (int) $pdo->query('SELECT COUNT(*) FROM visitors')->fetchColumn();

$stDay = $pdo->prepare('SELECT weergaven, bezoeken, uniek FROM day_stats WHERE day = ? LIMIT 1');
$stDay->execute([$day]);
$drow = $stDay->fetch(PDO::FETCH_ASSOC);
$vandaag = [
    'weergaven' => $drow ? (int) $drow['weergaven'] : 0,
    'bezoeken' => $drow ? (int) $drow['bezoeken'] : 0,
    'uniek' => $drow ? (int) $drow['uniek'] : 0,
];

$sindsTs = (int) $pdo->query("SELECT value FROM counters WHERE name = 'sinds'")->fetchColumn();
$sindsLabel = (new DateTimeImmutable('@' . $sindsTs))->setTimezone($tzNl)->format('d-m-Y');

out([
    'ok' => true,
    'skipped' => $skipCount,
    'sinds' => $sindsLabel,
    'vandaag' => $vandaag,
    'totaal' => [
        'weergaven' => $totWeergaven,
        'bezoeken' => $totBezoeken,
        'uniek' => $totUniek,
    ],
    'uitleg' => 'Telling op deze webserver. Geen cookies en geen externe trackers. '
        . 'Unieke bezoekers: één hash per browser/apparaat (IP en browserkenmerk, niet onversleuteld opgeslagen). '
        . 'Bezoeken: sessies (nieuw na ca. 30 minuten zonder activiteit of op een nieuwe dag). '
        . 'Weergaven: aantal geladen pagina\'s.',
]);
