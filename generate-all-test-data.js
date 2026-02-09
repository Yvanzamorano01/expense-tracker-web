const { execSync } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   🚀 EXPENSE TRACKER - TEST DATA GENERATOR');
console.log('   Generates 3 months of realistic USD expenses');
console.log('═══════════════════════════════════════════════════════════════\n');

const scripts = [
  { file: 'delete-all-expenses.js', desc: '🗑️  Step 1: Deleting all existing expenses...' },
  { file: 'generate-october-2025.js', desc: '🍂 Step 2: Generating October 2025...' },
  { file: 'generate-november-2025.js', desc: '🦃 Step 3: Generating November 2025...' },
  { file: 'generate-december-2025.js', desc: '🎄 Step 4: Generating December 2025...' }
];

async function runAll() {
  for (const script of scripts) {
    console.log('\n' + '─'.repeat(60));
    console.log(script.desc);
    console.log('─'.repeat(60) + '\n');

    try {
      execSync(`node ${path.join(__dirname, script.file)}`, {
        stdio: 'inherit',
        cwd: __dirname
      });
    } catch (error) {
      console.error(`\n❌ Error running ${script.file}`);
      process.exit(1);
    }

    // Small delay between scripts
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('   ✅ ALL DONE! Test data generated successfully');
  console.log('   📊 Summary:');
  console.log('      • October 2025: ~35 expenses');
  console.log('      • November 2025: ~37 expenses');
  console.log('      • December 2025: ~47 expenses');
  console.log('      • Total: ~119 expenses in USD');
  console.log('═'.repeat(60) + '\n');
}

runAll().catch(console.error);
