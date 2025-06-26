import dotenv from 'dotenv';
import invoiceTools from './tools/invoiceTools.js';

dotenv.config();

async function testTools() {
  console.log('🧪 Testing QuickBooks Tools...\n');

  // Check if connected
  if (!tokenStore.accessToken) {
    console.log('❌ Not connected to QuickBooks. Please connect first.');
    return;
  }

  console.log('✅ Connected to QuickBooks');
  console.log(`📊 Realm ID: ${tokenStore.realmId}\n`);

  try {
    // Test 1: List Invoices
    console.log('1️⃣ Testing listInvoices...');
    const listResult = await invoiceTools.listInvoices.execute({ maxResults: 3 });
    console.log('   Status:', listResult.status);
    if (listResult.status === 'ok') {
      console.log(`   Found ${listResult.count} invoices`);
      if (listResult.data.length > 0) {
        console.log(`   Sample: ${listResult.data[0].DocNumber || 'No DocNumber'} - $${listResult.data[0].TotalAmt || 'N/A'}`);
      }
    } else {
      console.log('   Error:', listResult.error);
    }
    console.log('');

    // Test 2: Get specific invoice (if we have one)
    if (listResult.status === 'ok' && listResult.data.length > 0) {
      console.log('2️⃣ Testing getInvoice...');
      const firstInvoice = listResult.data[0];
      const getResult = await invoiceTools.getInvoice.execute({ invoiceId: firstInvoice.Id });
      console.log('   Status:', getResult.status);
      if (getResult.status === 'ok') {
        console.log(`   Retrieved invoice: ${getResult.data.DocNumber || 'No DocNumber'}`);
      } else {
        console.log('   Error:', getResult.error);
      }
      console.log('');
    }

    // Test 3: Test with criteria
    console.log('3️⃣ Testing listInvoices with criteria...');
    const criteriaResult = await invoiceTools.listInvoices.execute({ 
      criteria: 'TotalAmt > 0',
      maxResults: 2 
    });
    console.log('   Status:', criteriaResult.status);
    if (criteriaResult.status === 'ok') {
      console.log(`   Found ${criteriaResult.count} invoices with TotalAmt > 0`);
    } else {
      console.log('   Error:', criteriaResult.error);
    }
    console.log('');

    console.log('🎉 Tool testing completed!');
    console.log('\n📝 Note: createInvoice, updateInvoice, deleteInvoice, and emailInvoicePdf');
    console.log('   are implemented but not tested here to avoid modifying your data.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTools().catch(console.error); 