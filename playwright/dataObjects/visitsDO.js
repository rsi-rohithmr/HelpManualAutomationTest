class VisitDO {
	visitHeaderSection = {
		'Visit Number': '',
		'Visit Class': '',
		'Special Courtesy': '',
	};

	visitDetailsSection = {
		'Visit Number': '',
		'Visit Date/Time': '',
		'Encounter Type': '',
		'Encounter Status': '',
		'Attending Physician/Nurse': '',
		'Location of Encounter': '',
		'Visit Reason/History': '',
		'Visit Class': '',
		'Special Courtesy': '',
	};

	clinicalSection = {
		'Plan of care': '',
		'Follow-Up Instructions': '',
	};

	accidentNotes = {
		sectionHeader: 'Accident Notes',
		count: 0,
		note0Header: 'Accident Notes',
		note0Content: '',
		note0CreatedBy: '',
		note0CreatedDate: '',
	};
}

export const visitDO = new VisitDO();
