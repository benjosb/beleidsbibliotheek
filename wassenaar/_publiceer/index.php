<?php
/**
 * BeleidsBibliotheek — Download productie-pakket
 * Maakt een zip van alle acceptatie-bestanden, klaar om te uploaden naar Argeweb.
 */

$WACHTWOORD_HASH = password_hash('wassenaar2026', PASSWORD_DEFAULT);
// Herbereken bij wachtwoordwijziging:
// echo password_hash('nieuw_wachtwoord', PASSWORD_DEFAULT);

$SITE_ROOT = '/var/www/wassenaar.besluit-wijzer.nl';

$BESTANDEN = [
    'index.html', 'app.js', 'data.js', 'styles.css', 'disclaimer.js',
    'taakvelden_iv3.js', 'stempel.svg', 'wassenaar_logo_fc kopie.svg',
    'reactie.html', 'werklijst-reacties.html', 'werklijst-sociaal-domein.html',
    'beleidsnotas.html', 'beleidsnotas.js',
    'overdrachtsdossier.html', 'overdrachtsdossier.js',
    'roadmap.html', 'verbeterpunten-beheer.html', 'wijzigingen.html',
    'beheer.html', 'viewer.html',
    'manifest.webmanifest', 'sw.js', 'pwa-register.js',
    'favicon.ico', 'favicon.svg', 'favicon-32.png',
];

$MAPPEN = ['pwa-icons', 'schrijf-wijzer', 'stats'];

// --- Afhandeling POST (download zip) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['wachtwoord'])) {
    if (!password_verify($_POST['wachtwoord'], $WACHTWOORD_HASH)) {
        $fout = 'Onjuist wachtwoord.';
    } else {
        $zipFile = tempnam(sys_get_temp_dir(), 'bbw_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
            $fout = 'Kan zip niet aanmaken.';
        } else {
            $teller = 0;
            foreach ($BESTANDEN as $f) {
                $pad = "$SITE_ROOT/$f";
                if (file_exists($pad)) {
                    $zip->addFile($pad, $f);
                    $teller++;
                }
            }
            foreach ($MAPPEN as $map) {
                $mapPad = "$SITE_ROOT/$map";
                if (is_dir($mapPad)) {
                    $iter = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($mapPad, RecursiveDirectoryIterator::SKIP_DOTS)
                    );
                    foreach ($iter as $item) {
                        if ($item->isFile()) {
                            $relPad = "$map/" . $iter->getSubPathname();
                            $zip->addFile($item->getPathname(), $relPad);
                            $teller++;
                        }
                    }
                }
            }
            $zip->close();

            $datum = date('Y-m-d_Hi');
            header('Content-Type: application/zip');
            header("Content-Disposition: attachment; filename=\"beleidsbibliotheek_productie_{$datum}.zip\"");
            header('Content-Length: ' . filesize($zipFile));
            readfile($zipFile);
            unlink($zipFile);
            exit;
        }
    }
}
?><!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeleidsBibliotheek — Publiceer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f4f5f0;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,.1);
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }
  .logo { color: #55601c; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .sub { color: #888; font-size: 14px; margin-bottom: 32px; }
  label { display: block; text-align: left; font-size: 13px; color: #666; margin-bottom: 6px; }
  input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 24px;
    transition: border-color .2s;
  }
  input:focus { outline: none; border-color: #55601c; }
  button {
    width: 100%;
    padding: 14px;
    background: #55601c;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s;
  }
  button:hover { background: #6b7a24; }
  .fout {
    margin-top: 16px;
    padding: 12px;
    background: #fdecea;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    color: #721c24;
    font-size: 14px;
  }
  .info {
    margin-top: 24px;
    padding: 16px;
    background: #f0f4e8;
    border-radius: 8px;
    font-size: 13px;
    color: #555;
    text-align: left;
    line-height: 1.6;
  }
  .info strong { color: #55601c; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">BeleidsBibliotheek</div>
  <div class="sub">Download productie-pakket</div>

  <form method="post">
    <label for="ww">Wachtwoord</label>
    <input type="password" id="ww" name="wachtwoord" placeholder="Voer het wachtwoord in" autofocus required>
    <button type="submit">Download zip voor productie</button>
  </form>

  <?php if (!empty($fout)): ?>
    <div class="fout"><?= htmlspecialchars($fout) ?></div>
  <?php endif; ?>

  <div class="info">
    <strong>Instructie:</strong><br>
    1. Voer het wachtwoord in<br>
    2. Klik op de knop — er wordt een zip gedownload<br>
    3. Pak de zip uit<br>
    4. Upload alle bestanden naar Argeweb (beleidsbibliotheekwassenaar.nl)
  </div>
</div>
</body>
</html>
