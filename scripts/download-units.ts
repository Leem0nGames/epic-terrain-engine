/**
 * Script para descargar unidades de Wesnoth
 */

import * as fs from 'fs';
import * as path from 'path';
import https from 'https';

const CDN_UNITS = 'https://cdn.jsdelivr.net/gh/wesnoth/wesnoth@master/data/core/images/units/';
const LOCAL_UNITS_DIR = path.join(__dirname, '..', 'public', 'assets', 'units');

// Unidades a descargar
const UNITS = {
  'elves-wood': ['fighter.png', 'archer.png', 'shaman.png'],
  'orcs': ['grunt.png', 'archer.png', 'wolf-rider.png']
};

/**
 * Descarga un archivo desde una URL
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        console.warn(`⚠️  No encontrado: ${path.basename(destPath)}`);
        file.close();
        resolve();
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${path.basename(destPath)}`);
        resolve();
      });
    }).on('error', () => {
      file.close();
      resolve();
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('📥 Descargando unidades de Wesnoth...\n');

  const downloads: Promise<void>[] = [];

  for (const [faction, units] of Object.entries(UNITS)) {
    console.log(`Facción: ${faction}`);
    
    for (const unit of units) {
      const url = `${CDN_UNITS}${faction}/${unit}`;
      const dest = path.join(LOCAL_UNITS_DIR, faction, unit);
      downloads.push(downloadFile(url, dest));
    }
  }

  await Promise.all(downloads);
  console.log('\n🎉 Unidades descargadas');
}

main().catch(console.error);
