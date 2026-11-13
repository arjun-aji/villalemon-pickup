import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../utils/formatters';

export const excelExportService = {
  async exportFullWorkbook(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VillaLemon Pickup Transport Engine';
    workbook.created = new Date();

    // 1. Fetch live data from Supabase
    const [
      { data: trips },
      { data: organizations },
      { data: drivers },
      { data: vehicles },
      { data: expenses },
      { data: driverReports },
      { data: driverLedger },
      { data: invoices },
      { data: payments },
      { data: clientSummaries },
      { data: driverBalances },
      { data: docAlerts },
      { data: settings }
    ] = await Promise.all([
      supabase
        .from('trips')
        .select('*, driver:drivers(full_name, phone, employment_type, per_trip_payment), vehicle:vehicles(registration_number, vehicle_type), organization:organizations(name), driver_reports(*)')
        .order('trip_date', { ascending: true }),
      supabase.from('organizations').select('*').order('name'),
      supabase.from('drivers').select('*').order('full_name'),
      supabase.from('vehicles').select('*').order('registration_number'),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('driver_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('driver_ledger').select('*, driver:drivers(full_name)').order('entry_date', { ascending: false }),
      supabase.from('invoices').select('*, organization:organizations(name)').order('invoice_date', { ascending: false }),
      supabase.from('payments').select('*, organization:organizations(name)').order('payment_date', { ascending: false }),
      supabase.from('v_client_summary').select('*'),
      supabase.from('v_driver_balances').select('*'),
      supabase.from('v_vehicle_document_alerts').select('*'),
      supabase.from('system_settings').select('*').limit(1).maybeSingle(),
    ]);

    const allTrips = trips || [];
    const businessName = settings?.data?.business_name || 'Varkala Holidays';
    const businessPhone = settings?.data?.phone || '+91 90482 79460';

    // Thin border helper
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    };

    // ==========================================
    // WORKSHEET 1: TRIP SHEET (Exact replica of user's worksheet)
    // ==========================================
    const wsTripSheet = workbook.addWorksheet('Trip Sheet', {
      properties: { tabColor: { argb: 'FF2E75B6' } },
      pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
    });

    wsTripSheet.columns = [
      { key: 'col1', width: 22 },
      { key: 'col2', width: 26 },
      { key: 'col3', width: 30 },
      { key: 'col4', width: 30 },
      { key: 'col5', width: 38 },
      { key: 'col6', width: 22 },
      { key: 'col7', width: 20 },
      { key: 'col8', width: 30 },
    ];

    // Row 1: Brand title
    const r1 = wsTripSheet.getRow(1);
    r1.getCell(1).value = businessName;
    r1.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF000000' }, name: 'Arial' };

    // Row 2: Subtitle / Phone
    const r2 = wsTripSheet.getRow(2);
    r2.getCell(1).value = `Taxi & Transport Management System | Phone: ${businessPhone}`;
    r2.getCell(1).font = { size: 9, color: { argb: 'FF595959' }, name: 'Arial' };

    // Row 3: Sheet Title
    const r3 = wsTripSheet.getRow(3);
    r3.getCell(1).value = 'TRIP SHEET';
    r3.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF000000' }, name: 'Arial' };

    // Row 5: Driver filter
    const r5 = wsTripSheet.getRow(5);
    r5.getCell(1).value = 'Driver';
    r5.getCell(1).font = { bold: true, size: 10, name: 'Arial' };
    r5.getCell(2).value = drivers && drivers.length > 0 ? drivers[0].full_name : 'All Drivers';
    r5.getCell(2).font = { size: 11, name: 'Calibri' };
    r5.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    r5.getCell(3).value = 'Choose the driver, a start date and the number of days (1 = one day, 7 = one week). Or choose one Trip ID instead.';
    r5.getCell(3).font = { italic: true, size: 9, color: { argb: 'FF808080' }, name: 'Arial' };

    // Row 6: Start date
    const r6 = wsTripSheet.getRow(6);
    r6.getCell(1).value = 'Start date';
    r6.getCell(1).font = { bold: true, size: 10, name: 'Arial' };
    r6.getCell(2).value = allTrips.length > 0 && (allTrips[0].trip_date || allTrips[0].pickup_date) 
      ? formatDate(allTrips[0].trip_date || allTrips[0].pickup_date) 
      : '01-Nov-2026';
    r6.getCell(2).font = { size: 11, name: 'Calibri' };
    r6.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    r6.getCell(3).value = 'Then File > Download > PDF to send it on WhatsApp.';
    r6.getCell(3).font = { italic: true, size: 9, color: { argb: 'FF808080' }, name: 'Arial' };

    // Row 7: Number of days
    const r7 = wsTripSheet.getRow(7);
    r7.getCell(1).value = 'Number of days';
    r7.getCell(1).font = { bold: true, size: 10, name: 'Arial' };
    r7.getCell(2).value = 100;
    r7.getCell(2).font = { size: 11, name: 'Calibri' };
    r7.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

    // Row 8: Optional Trip ID
    const r8 = wsTripSheet.getRow(8);
    r8.getCell(1).value = 'Or one Trip ID (optional)';
    r8.getCell(1).font = { bold: true, size: 10, name: 'Arial' };

    // Row 9: Summary header line
    const r9 = wsTripSheet.getRow(9);
    const firstDriver = drivers && drivers.length > 0 ? drivers[0].full_name : 'All Drivers';
    r9.getCell(1).value = `Driver: ${firstDriver} | Active Trip Log | ${allTrips.length} trip(s)`;
    r9.getCell(1).font = { bold: true, size: 10, name: 'Arial' };

    // Row 11: Dark teal header row (#1F4E5F)
    const tripSheetHeaders = [
      'Date / Time',
      'Trip ID / Category',
      'Guest / Passengers / Contact',
      'Pickup (terminal)',
      'Drop-off / places to visit',
      'Vehicle',
      'Collect from guest',
      'Note'
    ];
    const r11 = wsTripSheet.getRow(11);
    tripSheetHeaders.forEach((h, idx) => {
      const cell = r11.getCell(idx + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E5F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });

    // Rows 12+: Trip Sheet Data Rows (height=66, multiline cells, top-aligned)
    allTrips.forEach((t, i) => {
      const rowNum = 12 + i;
      const row = wsTripSheet.getRow(rowNum);
      row.height = 66;

      const dateStr = formatDate(t.trip_date || t.pickup_date || '');
      const timeStr = formatTime(t.pickup_time || '');
      const flightInfo = t.flight_number_and_time || t.flight_number || (t.trip_category?.toLowerCase().includes('airport') ? 'Nil' : '');
      const category = t.trip_category || 'Trip';
      const guest = t.guest_names || t.customer_name || 'Guest';
      const pax = t.total_people || t.num_passengers || 1;
      const contact = t.guest_contact_number || t.customer_phone || 'not given';
      const pickup = t.pickup_location || '';
      const terminal = t.airport_terminal || (t.trip_category?.toLowerCase().includes('airport') ? 'NOT SET' : '');
      const dropoff = t.dropoff_location || t.destination || '';
      const finalDropoff = t.final_dropoff || 'Return to pickup point';
      const vehicleReg = t.vehicle?.registration_number || t.vehicle_reg || 'not assigned';
      const cabType = t.vehicle?.vehicle_type || t.required_cab_type || 'Sedan';
      const collectAmt = Number(t.amount_driver_must_collect || t.amount_to_collect || 0);
      const note = t.special_instructions || '';

      // Cell 1: Date / Time
      const c1 = row.getCell(1);
      c1.value = `${dateStr}\n${timeStr}`;

      // Cell 2: Trip ID / Category / Flight
      const c2 = row.getCell(2);
      c2.value = flightInfo ? `${t.trip_number}\n${category}\nFlight: ${flightInfo}` : `${t.trip_number}\n${category}`;

      // Cell 3: Guest / Passengers / Contact
      const c3 = row.getCell(3);
      c3.value = `${guest}\nPassengers: ${pax}\nContact: ${contact}`;

      // Cell 4: Pickup (terminal)
      const c4 = row.getCell(4);
      c4.value = terminal ? `${pickup}\nTerminal: ${terminal}` : pickup;

      // Cell 5: Drop-off / places to visit
      const c5 = row.getCell(5);
      if (category.toLowerCase().includes('sightseeing')) {
        c5.value = `Places to visit: ${dropoff}\nFinal drop-off: ${finalDropoff}`;
      } else {
        c5.value = `Drop-off: ${dropoff}`;
      }

      // Cell 6: Vehicle
      const c6 = row.getCell(6);
      c6.value = `${vehicleReg}\n(${cabType})`;

      // Cell 7: Collect from guest
      const c7 = row.getCell(7);
      if (collectAmt > 0) {
        c7.value = `COLLECT\nRs. ${collectAmt.toLocaleString('en-IN')}`;
        c7.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FF166534' } };
      } else {
        c7.value = 'Do NOT collect';
        c7.font = { size: 10, name: 'Arial', color: { argb: 'FF475569' } };
      }

      // Cell 8: Note
      const c8 = row.getCell(8);
      c8.value = note;

      // Apply shared styling to all 8 cells in this row
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        if (c !== 7 || collectAmt <= 0) {
          cell.font = { size: 10, name: 'Arial' };
        }
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        cell.border = thinBorder;
      }
    });

    // ==========================================
    // WORKSHEET 2: TRIPS (Master 38 columns)
    // ==========================================
    const wsTrips = workbook.addWorksheet('Trips', {
      properties: { tabColor: { argb: 'FF10243A' } },
    });

    const masterHeaders = [
      'Client / Organisation',
      'Ordered by (contact person)',
      'Trip date',
      'Pickup time',
      'Trip category',
      'Guest name(s)',
      'Guest contact number',
      'Total people',
      'Pickup location',
      'Drop-off location',
      'Flight number and time',
      'Required cab type',
      'Special instructions',
      'Trip ID (auto)',
      'Assigned driver',
      'Assigned vehicle',
      'Trip selling price (INR)',
      'Trip status',
      'Invoice No',
      'Trip expenses (INR) (auto)',
      'Trip profit (INR) (auto)',
      'Billing status (auto)',
      'Dispatch key (auto)',
      'Collection rule (auto)',
      'Amount driver must collect (INR)',
      'Collected by driver (INR) (auto)',
      'Collection difference (INR) (auto)',
      'Advance key (auto)',
      'Statement key (auto)',
      "Driver pay for this trip (INR) - blank = driver's rate",
      'Driver pay used (INR) (auto)',
      'Airport terminal (airport trips)',
      'Final drop-off (sightseeing only, blank = return to pickup point)',
      'Collection status (auto)',
      'Diesel reported by driver (INR) (auto)',
      'Parking/toll/food etc. reported (INR) (auto)',
      'Workshop reported by driver (INR) (auto)',
      'Driver details (auto)'
    ];

    wsTrips.addRow(masterHeaders);
    const tripsHeaderRow = wsTrips.getRow(1);
    tripsHeaderRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10243A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    allTrips.forEach(t => {
      const rep = t.driver_reports ? (Array.isArray(t.driver_reports) ? t.driver_reports[0] : t.driver_reports) : null;
      const diesel = Number(rep?.diesel_expense || 0);
      const foodToll = Number(rep?.parking_toll_permits_tickets_food || 0);
      const workshop = Number(rep?.workshop_expense || 0);
      const totalTripExp = diesel + foodToll + workshop;

      const sellingPrice = Number(t.trip_selling_price || 0);
      const driverPay = Number(t.driver_trip_pay_override || (t.driver?.employment_type === 'Per-trip payment' ? t.driver?.per_trip_payment : 0) || 0);
      const profit = sellingPrice - driverPay - totalTripExp;
      const collectAmt = Number(t.amount_driver_must_collect || 0);
      const collected = Number(t.collected_by_driver || (t.trip_status === 'Completed' ? collectAmt : 0));

      wsTrips.addRow([
        t.organization?.name || 'Villa Lemon',
        t.ordered_by || 'Shahid',
        t.trip_date || t.pickup_date || '',
        t.pickup_time || '',
        t.trip_category || '',
        t.guest_names || t.customer_name || '',
        t.guest_contact_number || t.customer_phone || '',
        t.total_people || t.num_passengers || 1,
        t.pickup_location || '',
        t.dropoff_location || t.destination || '',
        t.flight_number_and_time || t.flight_number || '',
        t.required_cab_type || '',
        t.special_instructions || '',
        t.trip_number || '',
        t.driver?.full_name || '',
        t.vehicle?.registration_number || '',
        sellingPrice,
        t.trip_status || 'Confirmed',
        t.invoice_number || '',
        totalTripExp,
        profit,
        t.invoice_number ? 'Invoiced' : 'Unbilled',
        `${t.driver?.full_name || 'Driver'}|${t.trip_date || ''}`,
        t.collection_rule || (collectAmt > 0 ? 'Collect' : 'Do not collect'),
        collectAmt,
        collected,
        collected - collectAmt,
        `${t.driver?.full_name || 'Driver'}|1`,
        `${t.organization?.name || 'Client'}|${t.trip_number}`,
        driverPay,
        driverPay,
        t.airport_terminal || '',
        t.final_dropoff || '',
        t.collection_status || (collected >= collectAmt ? 'Received' : 'Pending'),
        diesel,
        foodToll,
        workshop,
        t.driver?.phone ? `Phone: ${t.driver.phone}` : ''
      ]);
    });

    // Auto-fit column widths for Trips sheet
    if (wsTrips.columns) {
      wsTrips.columns.forEach(col => {
        if (col && typeof col.eachCell === 'function') {
          let maxLen = 12;
          col.eachCell({ includeEmpty: false }, cell => {
            const valStr = cell.value ? String(cell.value) : '';
            if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 35);
          });
          col.width = maxLen + 2;
        }
      });
    }

    // ==========================================
    // WORKSHEET 3: DRIVER DISPATCH (WhatsApp message templates)
    // ==========================================
    const wsDispatch = workbook.addWorksheet('Driver Dispatch');
    wsDispatch.columns = [{ width: 28 }, { width: 65 }, { width: 30 }];
    wsDispatch.addRow(['Driver Dispatch - WhatsApp messages']);
    wsDispatch.getRow(1).getCell(1).font = { bold: true, size: 14, name: 'Arial' };
    wsDispatch.addRow(['Pick a trip, or copy the formatted dispatch below directly to WhatsApp.']);
    wsDispatch.getRow(2).getCell(1).font = { italic: true, size: 9, color: { argb: 'FF808080' }, name: 'Arial' };
    wsDispatch.addRow([]);

    let dispatchRow = 4;
    allTrips.slice(0, 15).forEach((t, idx) => {
      const dateStr = formatDate(t.trip_date || t.pickup_date || '');
      const timeStr = formatTime(t.pickup_time || '');
      const guest = t.guest_names || t.customer_name || 'Guest';
      const pax = t.total_people || t.num_passengers || 1;
      const contact = t.guest_contact_number || t.customer_phone || 'not given';
      const cat = t.trip_category || 'Trip';
      const vehicle = t.vehicle ? `${t.vehicle.registration_number} (${t.vehicle.vehicle_type})` : (t.required_cab_type || 'Cab');
      const collectAmt = Number(t.amount_driver_must_collect || 0);
      const collectMsg = collectAmt > 0 ? `*COLLECT from guest: Rs. ${collectAmt.toLocaleString('en-IN')}*` : `*Do NOT collect any money from the guest*`;

      const msg = `*${t.trip_number}*\nDate: ${dateStr}\nTrip category: ${cat}\nVehicle: ${vehicle}\nPickup time: ${timeStr}\nPickup: ${t.pickup_location || ''}\nDrop-off: ${t.dropoff_location || t.destination || ''}\nGuest: ${guest}\nPassengers: ${pax}\nCustomer contact: ${contact}\n${t.flight_number_and_time ? `Flight: ${t.flight_number_and_time}\n` : ''}${collectMsg}\nNote: ${t.special_instructions || 'None'}`;

      const row = wsDispatch.getRow(dispatchRow);
      row.getCell(1).value = `Trip ${idx + 1}: ${t.trip_number} (${t.driver?.full_name || 'Unassigned'})`;
      row.getCell(1).font = { bold: true, size: 10, name: 'Arial' };
      row.getCell(2).value = msg;
      row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
      row.getCell(2).border = thinBorder;
      row.height = 110;

      dispatchRow++;
    });

    // ==========================================
    // WORKSHEET 4: DRIVER SETTLEMENT
    // ==========================================
    const wsSettlement = workbook.addWorksheet('Driver Settlement');
    wsSettlement.columns = [
      { header: 'Driver Name', key: 'name', width: 20 },
      { header: 'Trips Assigned', key: 'trips_count', width: 16 },
      { header: 'Total Driver Pay (INR)', key: 'driver_pay', width: 22 },
      { header: 'Fuel Reimbursable (INR)', key: 'fuel', width: 22 },
      { header: 'Toll/Food Reimbursable (INR)', key: 'toll_food', width: 25 },
      { header: 'Cash Collected (INR)', key: 'cash_collected', width: 22 },
      { header: 'Net Balance / Settlement (INR)', key: 'net_balance', width: 28 },
    ];
    wsSettlement.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10243A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    (driverBalances || drivers || []).forEach(d => {
      wsSettlement.addRow({
        name: d.full_name || '',
        trips_count: d.total_trips || 0,
        driver_pay: Number(d.balance_payable_to_driver || d.per_trip_payment || 0),
        fuel: Number(d.total_fuel_expenses || 0),
        toll_food: Number(d.total_toll_food || 0),
        cash_collected: Number(d.cash_owed_to_office || 0),
        net_balance: Number(d.net_settlement_amount || 0),
      });
    });

    // ==========================================
    // WORKSHEETS 5-13: MASTER SUPPORTING SHEETS
    // ==========================================
    const generalHeaderStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10243A' } } as ExcelJS.Fill,
      alignment: { vertical: 'middle', horizontal: 'center' } as Partial<ExcelJS.Alignment>,
    };

    // CLIENTS
    const wsClients = workbook.addWorksheet('Clients');
    wsClients.columns = [
      { header: 'Organization Name', key: 'name', width: 24 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Contact Person', key: 'contact_person', width: 18 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Payment Terms', key: 'payment_terms', width: 18 },
      { header: 'Credit Limit (INR)', key: 'credit_limit', width: 18 },
      { header: 'Completed Value', key: 'completed_trip_value', width: 18 },
      { header: 'Outstanding (INR)', key: 'outstanding_amount', width: 18 },
      { header: 'Credit Status', key: 'credit_status', width: 16 },
    ];
    wsClients.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (clientSummaries || organizations || []).forEach(c => {
      wsClients.addRow({
        name: c.organization_name || c.name || '',
        type: c.organization_type || c.type || '',
        contact_person: c.contact_person || '',
        phone: c.phone || '',
        payment_terms: c.payment_terms || '',
        credit_limit: Number(c.credit_limit) || 0,
        completed_trip_value: Number(c.completed_trip_value) || 0,
        outstanding_amount: Number(c.outstanding_amount) || 0,
        credit_status: c.credit_status || 'OK',
      });
    });

    // DRIVERS
    const wsDrivers = workbook.addWorksheet('Drivers');
    wsDrivers.columns = [
      { header: 'Driver Name', key: 'full_name', width: 20 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Licence No', key: 'driving_licence_no', width: 18 },
      { header: 'Licence Expiry', key: 'licence_expiry', width: 16 },
      { header: 'Employment Type', key: 'employment_type', width: 20 },
      { header: 'Per-Trip Pay (INR)', key: 'per_trip_payment', width: 18 },
      { header: 'Balance Payable', key: 'balance_payable_to_driver', width: 18 },
      { header: 'Cash He Owes', key: 'cash_owed_to_office', width: 18 },
      { header: 'Net Settlement', key: 'net_settlement_amount', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsDrivers.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (driverBalances || drivers || []).forEach(d => {
      wsDrivers.addRow({
        full_name: d.full_name || '',
        phone: d.phone || '',
        driving_licence_no: d.driving_licence_no || '',
        licence_expiry: d.licence_expiry || '',
        employment_type: d.employment_type || '',
        per_trip_payment: Number(d.per_trip_payment) || 0,
        balance_payable_to_driver: Number(d.balance_payable_to_driver) || 0,
        cash_owed_to_office: Number(d.cash_owed_to_office) || 0,
        net_settlement_amount: Number(d.net_settlement_amount) || 0,
        status: d.status || 'Active',
      });
    });

    // VEHICLES
    const wsVehicles = workbook.addWorksheet('Vehicles');
    wsVehicles.columns = [
      { header: 'Registration Number', key: 'registration_number', width: 20 },
      { header: 'Vehicle Type', key: 'vehicle_type', width: 16 },
      { header: 'Capacity', key: 'passenger_capacity', width: 12 },
      { header: 'Ownership', key: 'ownership', width: 14 },
      { header: 'Insurance Expiry', key: 'insurance_expiry', width: 16 },
      { header: 'Permit Expiry', key: 'permit_expiry', width: 16 },
      { header: 'Fitness Expiry', key: 'fitness_certificate_expiry', width: 16 },
      { header: 'Document Alert', key: 'document_alert', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsVehicles.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (docAlerts || vehicles || []).forEach(v => {
      wsVehicles.addRow({
        registration_number: v.registration_number || '',
        vehicle_type: v.vehicle_type || '',
        passenger_capacity: v.passenger_capacity || 4,
        ownership: v.ownership || 'Own',
        insurance_expiry: v.insurance_expiry || '',
        permit_expiry: v.permit_expiry || '',
        fitness_certificate_expiry: v.fitness_certificate_expiry || '',
        document_alert: v.document_alert || 'OK',
        status: v.status || 'Available',
      });
    });

    // EXPENSES
    const wsExpenses = workbook.addWorksheet('Expenses');
    wsExpenses.columns = [
      { header: 'Expense ID', key: 'id', width: 16 },
      { header: 'Date', key: 'expense_date', width: 14 },
      { header: 'Group', key: 'expense_group', width: 18 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Amount (INR)', key: 'amount', width: 16 },
      { header: 'Payment Method', key: 'payment_method', width: 16 },
      { header: 'Paid By', key: 'paid_by', width: 14 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    wsExpenses.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (expenses || []).forEach(e => {
      wsExpenses.addRow({
        id: e.id ? e.id.substring(0, 8) : '',
        expense_date: e.expense_date || '',
        expense_group: e.expense_group || '',
        category: e.category || '',
        amount: Number(e.amount) || 0,
        payment_method: e.payment_method || '',
        paid_by: e.paid_by || '',
        description: e.description || '',
      });
    });

    // DRIVER REPORTS
    const wsReports = workbook.addWorksheet('Driver Reports');
    wsReports.columns = [
      { header: 'Trip ID', key: 'trip_id', width: 16 },
      { header: 'Amount Collected', key: 'amount_collected', width: 18 },
      { header: 'Difference Note', key: 'collection_difference_note', width: 24 },
      { header: 'Diesel Expense', key: 'diesel_expense', width: 16 },
      { header: 'Toll/Parking/Food', key: 'parking_toll_permits_tickets_food', width: 18 },
      { header: 'Workshop Expense', key: 'workshop_expense', width: 18 },
      { header: 'Check Status', key: 'check_status', width: 16 },
    ];
    wsReports.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (driverReports || []).forEach(r => {
      wsReports.addRow({
        trip_id: r.trip_id || '',
        amount_collected: Number(r.amount_collected) || 0,
        collection_difference_note: r.collection_difference_note || '',
        diesel_expense: Number(r.diesel_expense) || 0,
        parking_toll_permits_tickets_food: Number(r.parking_toll_permits_tickets_food) || 0,
        workshop_expense: Number(r.workshop_expense) || 0,
        check_status: r.check_status || 'Verified',
      });
    });

    // DRIVER LEDGER
    const wsLedger = workbook.addWorksheet('Driver Ledger');
    wsLedger.columns = [
      { header: 'Date', key: 'entry_date', width: 14 },
      { header: 'Driver', key: 'driver_name', width: 20 },
      { header: 'Entry Type', key: 'entry_type', width: 24 },
      { header: 'Amount (INR)', key: 'amount', width: 16 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    wsLedger.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (driverLedger || []).forEach(l => {
      wsLedger.addRow({
        entry_date: l.entry_date || '',
        driver_name: l.driver?.full_name || '',
        entry_type: l.entry_type || '',
        amount: Number(l.amount) || 0,
        notes: l.notes || '',
      });
    });

    // BILLS & INVOICES
    const wsBills = workbook.addWorksheet('Bills');
    wsBills.columns = [
      { header: 'Invoice Number', key: 'invoice_number', width: 18 },
      { header: 'Invoice Date', key: 'invoice_date', width: 14 },
      { header: 'Client', key: 'organization_name', width: 22 },
      { header: 'Amount (INR)', key: 'invoice_amount', width: 18 },
      { header: 'Paid Against', key: 'paid_against_invoice', width: 18 },
      { header: 'Balance (INR)', key: 'balance', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsBills.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (invoices || []).forEach(inv => {
      wsBills.addRow({
        invoice_number: inv.invoice_number || '',
        invoice_date: inv.invoice_date || '',
        organization_name: inv.organization?.name || '',
        invoice_amount: Number(inv.invoice_amount) || 0,
        paid_against_invoice: Number(inv.paid_against_invoice) || 0,
        balance: (Number(inv.invoice_amount) || 0) - (Number(inv.paid_against_invoice) || 0),
        status: inv.status || 'Draft',
      });
    });

    // PAYMENTS
    const wsPayments = workbook.addWorksheet('Payments');
    wsPayments.columns = [
      { header: 'Receipt No', key: 'receipt_number', width: 16 },
      { header: 'Payment Date', key: 'payment_date', width: 14 },
      { header: 'Client', key: 'organization_name', width: 22 },
      { header: 'Amount (INR)', key: 'amount', width: 16 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    wsPayments.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    (payments || []).forEach(p => {
      wsPayments.addRow({
        receipt_number: p.receipt_number || '',
        payment_date: p.payment_date || '',
        organization_name: p.organization?.name || '',
        amount: Number(p.amount) || 0,
        payment_method: p.payment_method || '',
        notes: p.notes || '',
      });
    });

    // SETTINGS
    const wsSettings = workbook.addWorksheet('Settings');
    wsSettings.columns = [
      { header: 'Setting Key', key: 'key', width: 25 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    wsSettings.getRow(1).eachCell(cell => { Object.assign(cell, generalHeaderStyle); });
    wsSettings.addRow({ key: 'Business Name', value: businessName });
    wsSettings.addRow({ key: 'Phone', value: businessPhone });
    wsSettings.addRow({ key: 'Email', value: settings?.data?.email || 'villalemonhomestay@gmail.com' });
    wsSettings.addRow({ key: 'Export Date', value: new Date().toISOString() });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
