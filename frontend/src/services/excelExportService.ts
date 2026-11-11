import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabase';

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
      supabase.from('trips').select('*, driver:drivers(full_name), vehicle:vehicles(registration_number), organization:organizations(name)').order('trip_date', { ascending: false }),
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

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10243A' } } as ExcelJS.Fill,
      alignment: { vertical: 'middle', horizontal: 'center' } as Partial<ExcelJS.Alignment>,
    };

    // SHEET 1: TRIPS (38 columns matching primary business workbook)
    const wsTrips = workbook.addWorksheet('Trips');
    wsTrips.columns = [
      { header: 'Trip ID', key: 'trip_number', width: 14 },
      { header: 'Client / Organization', key: 'organization_name', width: 22 },
      { header: 'Ordered By', key: 'ordered_by', width: 18 },
      { header: 'Trip Date', key: 'trip_date', width: 14 },
      { header: 'Pickup Time', key: 'pickup_time', width: 12 },
      { header: 'Trip Category', key: 'trip_category', width: 18 },
      { header: 'Guest Name(s)', key: 'guest_names', width: 24 },
      { header: 'Guest Contact', key: 'guest_contact_number', width: 16 },
      { header: 'Total People', key: 'total_people', width: 12 },
      { header: 'Pickup Location', key: 'pickup_location', width: 24 },
      { header: 'Drop-off Location', key: 'dropoff_location', width: 24 },
      { header: 'Final Drop-off', key: 'final_dropoff', width: 20 },
      { header: 'Flight No / Time', key: 'flight_number_and_time', width: 18 },
      { header: 'Terminal', key: 'airport_terminal', width: 14 },
      { header: 'Required Cab', key: 'required_cab_type', width: 16 },
      { header: 'Assigned Driver', key: 'driver_name', width: 18 },
      { header: 'Assigned Cab', key: 'vehicle_reg', width: 16 },
      { header: 'Selling Price (INR)', key: 'trip_selling_price', width: 18 },
      { header: 'Amount to Collect', key: 'amount_driver_must_collect', width: 18 },
      { header: 'Collected by Driver', key: 'collected_by_driver', width: 18 },
      { header: 'Collection Status', key: 'collection_status', width: 16 },
      { header: 'Driver Trip Pay', key: 'driver_trip_pay_override', width: 16 },
      { header: 'Status', key: 'trip_status', width: 16 },
      { header: 'Special Instructions', key: 'special_instructions', width: 30 },
    ];
    wsTrips.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (trips || []).forEach(t => {
      wsTrips.addRow({
        trip_number: t.trip_number,
        organization_name: t.organization?.name || '',
        ordered_by: t.ordered_by || '',
        trip_date: t.trip_date || '',
        pickup_time: t.pickup_time || '',
        trip_category: t.trip_category || '',
        guest_names: t.guest_names || '',
        guest_contact_number: t.guest_contact_number || '',
        total_people: t.total_people || 1,
        pickup_location: t.pickup_location || '',
        dropoff_location: t.dropoff_location || '',
        final_dropoff: t.final_dropoff || '',
        flight_number_and_time: t.flight_number_and_time || '',
        airport_terminal: t.airport_terminal || '',
        required_cab_type: t.required_cab_type || '',
        driver_name: t.driver?.full_name || '',
        vehicle_reg: t.vehicle?.registration_number || '',
        trip_selling_price: Number(t.trip_selling_price) || 0,
        amount_driver_must_collect: Number(t.amount_driver_must_collect) || 0,
        collected_by_driver: Number(t.collected_by_driver) || 0,
        collection_status: t.collection_status || '',
        driver_trip_pay_override: Number(t.driver_trip_pay_override) || 0,
        trip_status: t.trip_status || '',
        special_instructions: t.special_instructions || '',
      });
    });

    // SHEET 2: CLIENTS & ORGANIZATIONS
    const wsClients = workbook.addWorksheet('Clients');
    wsClients.columns = [
      { header: 'Organization Name', key: 'name', width: 24 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Contact Person', key: 'contact_person', width: 18 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Payment Terms', key: 'payment_terms', width: 18 },
      { header: 'Credit Limit (INR)', key: 'credit_limit', width: 18 },
      { header: 'Completed Value', key: 'completed_trip_value', width: 18 },
      { header: 'Invoiced Amount', key: 'invoiced_issued_amount', width: 18 },
      { header: 'Total Paid', key: 'total_paid', width: 18 },
      { header: 'Outstanding (INR)', key: 'outstanding_amount', width: 18 },
      { header: 'Credit Status', key: 'credit_status', width: 16 },
    ];
    wsClients.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (clientSummaries || organizations || []).forEach(c => {
      wsClients.addRow({
        name: c.organization_name || c.name || '',
        type: c.organization_type || c.type || '',
        contact_person: c.contact_person || '',
        phone: c.phone || '',
        payment_terms: c.payment_terms || '',
        credit_limit: Number(c.credit_limit) || 0,
        completed_trip_value: Number(c.completed_trip_value) || 0,
        invoiced_issued_amount: Number(c.invoiced_issued_amount) || 0,
        total_paid: Number(c.total_paid) || 0,
        outstanding_amount: Number(c.outstanding_amount) || 0,
        credit_status: c.credit_status || 'OK',
      });
    });

    // SHEET 3: DRIVERS & DUAL BALANCES
    const wsDrivers = workbook.addWorksheet('Drivers');
    wsDrivers.columns = [
      { header: 'Driver Name', key: 'full_name', width: 20 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Licence No', key: 'driving_licence_no', width: 18 },
      { header: 'Licence Expiry', key: 'licence_expiry', width: 16 },
      { header: 'Employment Type', key: 'employment_type', width: 20 },
      { header: 'Per-Trip Pay', key: 'per_trip_payment', width: 16 },
      { header: 'Payable to Driver (INR)', key: 'balance_payable_to_driver', width: 22 },
      { header: 'Cash He Owes (INR)', key: 'cash_owed_to_office', width: 20 },
      { header: 'Net Settlement (INR)', key: 'net_settlement_amount', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsDrivers.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

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

    // SHEET 4: VEHICLES & DOCUMENT ALERTS
    const wsVehicles = workbook.addWorksheet('Vehicles');
    wsVehicles.columns = [
      { header: 'Registration Number', key: 'registration_number', width: 20 },
      { header: 'Vehicle Type', key: 'vehicle_type', width: 16 },
      { header: 'Capacity', key: 'passenger_capacity', width: 12 },
      { header: 'Ownership', key: 'ownership', width: 14 },
      { header: 'Owner / Supplier', key: 'owner_supplier_name', width: 20 },
      { header: 'Supplier Phone', key: 'supplier_phone', width: 16 },
      { header: 'Insurance Expiry', key: 'insurance_expiry', width: 16 },
      { header: 'Permit Expiry', key: 'permit_expiry', width: 16 },
      { header: 'Fitness Expiry', key: 'fitness_certificate_expiry', width: 16 },
      { header: 'PUC Expiry', key: 'puc_expiry', width: 16 },
      { header: 'Document Alert', key: 'document_alert', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsVehicles.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (docAlerts || vehicles || []).forEach(v => {
      wsVehicles.addRow({
        registration_number: v.registration_number || '',
        vehicle_type: v.vehicle_type || '',
        passenger_capacity: v.passenger_capacity || 4,
        ownership: v.ownership || 'Own',
        owner_supplier_name: v.owner_supplier_name || '',
        supplier_phone: v.supplier_phone || '',
        insurance_expiry: v.insurance_expiry || '',
        permit_expiry: v.permit_expiry || '',
        fitness_certificate_expiry: v.fitness_certificate_expiry || '',
        puc_expiry: v.puc_expiry || '',
        document_alert: v.document_alert || 'OK',
        status: v.status || 'Available',
      });
    });

    // SHEET 5: EXPENSES
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
      { header: 'Status', key: 'check_status', width: 14 },
    ];
    wsExpenses.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

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
        check_status: e.check_status || 'OK',
      });
    });

    // SHEET 6: DRIVER REPORTS
    const wsReports = workbook.addWorksheet('Driver Reports');
    wsReports.columns = [
      { header: 'Trip ID', key: 'trip_id', width: 16 },
      { header: 'Amount Collected', key: 'amount_collected', width: 18 },
      { header: 'Difference Note', key: 'collection_difference_note', width: 24 },
      { header: 'Diesel Expense', key: 'diesel_expense', width: 16 },
      { header: 'Toll/Parking/Food', key: 'parking_toll_permits_tickets_food', width: 18 },
      { header: 'Workshop Expense', key: 'workshop_expense', width: 18 },
      { header: 'Workshop Details', key: 'workshop_details', width: 24 },
      { header: 'Check Status', key: 'check_status', width: 14 },
    ];
    wsReports.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (driverReports || []).forEach(r => {
      wsReports.addRow({
        trip_id: r.trip_id || '',
        amount_collected: Number(r.amount_collected) || 0,
        collection_difference_note: r.collection_difference_note || '',
        diesel_expense: Number(r.diesel_expense) || 0,
        parking_toll_permits_tickets_food: Number(r.parking_toll_permits_tickets_food) || 0,
        workshop_expense: Number(r.workshop_expense) || 0,
        workshop_details: r.workshop_details || '',
        check_status: r.check_status || 'Pending Verification',
      });
    });

    // SHEET 7: DRIVER LEDGER
    const wsLedger = workbook.addWorksheet('Driver Ledger');
    wsLedger.columns = [
      { header: 'Date', key: 'entry_date', width: 14 },
      { header: 'Driver', key: 'driver_name', width: 20 },
      { header: 'Entry Type', key: 'entry_type', width: 24 },
      { header: 'Amount (INR)', key: 'amount', width: 16 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    wsLedger.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (driverLedger || []).forEach(l => {
      wsLedger.addRow({
        entry_date: l.entry_date || '',
        driver_name: l.driver?.full_name || '',
        entry_type: l.entry_type || '',
        amount: Number(l.amount) || 0,
        notes: l.notes || '',
      });
    });

    // SHEET 8: INVOICES & BILLS
    const wsBills = workbook.addWorksheet('Bills');
    wsBills.columns = [
      { header: 'Invoice Number', key: 'invoice_number', width: 18 },
      { header: 'Invoice Date', key: 'invoice_date', width: 14 },
      { header: 'Client', key: 'organization_name', width: 22 },
      { header: 'Invoice Type', key: 'invoice_type', width: 18 },
      { header: 'Amount (INR)', key: 'invoice_amount', width: 18 },
      { header: 'Paid Against', key: 'paid_against_invoice', width: 18 },
      { header: 'Balance (INR)', key: 'balance', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    wsBills.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    (invoices || []).forEach(inv => {
      wsBills.addRow({
        invoice_number: inv.invoice_number || '',
        invoice_date: inv.invoice_date || '',
        organization_name: inv.organization?.name || '',
        invoice_type: inv.invoice_type || '',
        invoice_amount: Number(inv.invoice_amount) || 0,
        paid_against_invoice: Number(inv.paid_against_invoice) || 0,
        balance: (Number(inv.invoice_amount) || 0) - (Number(inv.paid_against_invoice) || 0),
        status: inv.status || 'Draft',
      });
    });

    // SHEET 9: PAYMENTS
    const wsPayments = workbook.addWorksheet('Payments');
    wsPayments.columns = [
      { header: 'Receipt No', key: 'receipt_number', width: 16 },
      { header: 'Payment Date', key: 'payment_date', width: 14 },
      { header: 'Client', key: 'organization_name', width: 22 },
      { header: 'Amount (INR)', key: 'amount', width: 16 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    wsPayments.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

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

    // SHEET 10: SETTINGS
    const wsSettings = workbook.addWorksheet('Settings');
    wsSettings.columns = [
      { header: 'Setting Key', key: 'key', width: 25 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    wsSettings.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });

    wsSettings.addRow({ key: 'Business Name', value: settings?.data?.business_name || 'VillaLemon Pickup' });
    wsSettings.addRow({ key: 'Phone', value: settings?.data?.phone || '+91 90482 79460' });
    wsSettings.addRow({ key: 'Email', value: settings?.data?.email || 'villalemonhometay@gmail.com' });
    wsSettings.addRow({ key: 'Document Alert Days', value: settings?.data?.document_alert_days || 30 });
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

