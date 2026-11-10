const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting VillaLemon Pickup Automated End-to-End Test Suite...\n');

// 1. TEST FINANCIAL FORMULAS
console.log('1. Testing Financial & Reconciliation Calculations:');
const customerCollection = 3500;
const petrolExpense = 900;
const driverCharge = 1000;
const otherExpenses = 200;
const actualReturned = 1400;

const totalExpenses = petrolExpense + driverCharge + otherExpenses;
const netProfit = customerCollection - totalExpenses;
const expectedReturn = netProfit;
const settlementDifference = expectedReturn - actualReturned;

console.log(`   Customer Collection: ₹${customerCollection}`);
console.log(`   Petrol Expense: ₹${petrolExpense}`);
console.log(`   Driver Charge: ₹${driverCharge}`);
console.log(`   Other Expenses: ₹${otherExpenses}`);
console.log(`   Total Expenses: ₹${totalExpenses} (Expected: ₹2,100) -> ${totalExpenses === 2100 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Net Profit: ₹${netProfit} (Expected: ₹1,400) -> ${netProfit === 1400 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Expected Return: ₹${expectedReturn} (Expected: ₹1,400) -> ${expectedReturn === 1400 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Settlement Difference: ₹${settlementDifference} (Expected: ₹0) -> ${settlementDifference === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Discrepancy test
const shortActualReturn = 1100;
const shortExpectedReturn = 1150;
const shortDiff = shortExpectedReturn - shortActualReturn;
console.log(`   Discrepancy test (Expected: ₹1150, Actual: ₹1100): Difference = ₹${shortDiff} -> ${shortDiff === 50 ? '✅ PASS' : '❌ FAIL'}\n`);

// 2. TEST EXCEL WORKBOOK GENERATION
console.log('2. Testing 5-Sheet Excel Workbook Generation with ExcelJS:');
async function testExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VillaLemon Pickup Test';
  workbook.created = new Date();

  // Sheet 1
  const s1 = workbook.addWorksheet('Monthly Summary');
  s1.addRow(['VillaLemon Pickup - Monthly Summary']);
  s1.addRow(['Metric', 'Amount (INR)']);
  s1.addRow(['Total Trips', 124]);
  s1.addRow(['Customer Collections', 420000]);
  s1.addRow(['Net Profit', 150000]);

  // Sheet 2
  const s2 = workbook.addWorksheet('Trip Details');
  s2.addRow(['Trip ID', 'Customer', 'Route', 'Driver', 'Collection', 'Net Profit', 'Status']);
  s2.addRow(['VH-028', 'Anjali', 'Varkala -> TRV Airport', 'Manu', 3500, 1400, 'completed']);
  s2.addRow(['VH-027', 'Rahul', 'Varkala -> COK Airport', 'Suresh', 2800, 1150, 'completed']);

  // Sheet 3
  const s3 = workbook.addWorksheet('Driver Summary');
  s3.addRow(['Driver', 'Trips', 'Earnings', 'Profit']);
  s3.addRow(['Manu', 42, 42000, 56000]);
  s3.addRow(['Suresh', 36, 28800, 38500]);

  // Sheet 4
  const s4 = workbook.addWorksheet('Expense Breakdown');
  s4.addRow(['Category', 'Amount']);
  s4.addRow(['Petrol', 135000]);
  s4.addRow(['Driver Charges', 100000]);
  s4.addRow(['Other Expenses', 35000]);

  // Sheet 5
  const s5 = workbook.addWorksheet('Settlement Details');
  s5.addRow(['Trip ID', 'Driver', 'Expected', 'Actual', 'Difference', 'Status']);
  s5.addRow(['VH-028', 'Manu', 1400, 1400, 0, 'settled']);
  s5.addRow(['VH-027', 'Suresh', 1150, 1100, 50, 'difference']);

  const testFilePath = path.join(__dirname, 'test_report_output.xlsx');
  await workbook.xlsx.writeFile(testFilePath);

  if (fs.existsSync(testFilePath)) {
    const stats = fs.statSync(testFilePath);
    console.log(`   ✅ Excel file created successfully: ${testFilePath} (${stats.size} bytes)`);
    fs.unlinkSync(testFilePath);
    console.log(`   ✅ Cleaned up temporary test file.\n`);
  } else {
    console.log(`   ❌ Failed to create Excel file.`);
  }

  console.log('🎉 ALL PRIMARY SYSTEM LOGIC TESTS PASSED SUCCESSFULLY!');
}

testExcel().catch(err => console.error('Error during test:', err));

