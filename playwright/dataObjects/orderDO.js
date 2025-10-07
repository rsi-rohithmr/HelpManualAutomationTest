class OrderDO {
	orderDO = {
		'Ordered Date': '',
		'Accession Number': '',
		'Requested Date': '',
		Priority: '',
		'Filler Order Number': '',
		'Placed Order Number': '',
		'Referring Physician': '',
		'Referring Organization': '',
		Status: '',
		'Requested Appointment Date/Time': '',
		'Order priority': '',
		'Order Status': '',
		'Consulting Physician': '',
	};
	orderNotes = {
		sectionHeader: 'Order Notes',
		count: 0,
		note0Header: 'Order Notes',
		note0Content: '',
		note0CreatedBy: '',
		note0CreatedDate: '',
	};
}

export const orderDO = new OrderDO();
