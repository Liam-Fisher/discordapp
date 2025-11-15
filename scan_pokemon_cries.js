const fs = require('fs');
const path = require('path');

// Directory to scan
const samplesDir = 'C:\\Users\\Liam\\Documents\\Ableton\\User Library\\Samples\\pokemoncries';

// Output file
const outputFile = path.join(__dirname, 'pokemon_cries_list.txt');

try {
  // Read the directory
  const files = fs.readdirSync(samplesDir);

  // Filter for .mp3 files only (excluding .asd files)
  const mp3Files = files.filter(file => {
    return file.toLowerCase().endsWith('.mp3') && !file.toLowerCase().endsWith('.asd');
  });


  // Write to output file (one file per line)
  fs.writeFileSync(outputFile, `const cries = [\n\t${mp3Files.map(file => `"${file.slice(0, -4)}"\n`)}\n];` );

  console.log(`Success! Found ${mp3Files.length} MP3 files.`);
  console.log(`List saved to: ${outputFile}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
