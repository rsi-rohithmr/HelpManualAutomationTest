class PatientDO {
	generalInfo = {
		'Family Name': '',
		'Given Names': '',
		Prefix: '',
		Suffix: '',
		SSN: '',
		'Patient ID': '',
		"Driver's License #": '',
		'Birth Date': '',
		Gender: '',
		'Birth Sex': '',
		'Managing Organization': '',
		'Assigning Authority': '',
		"Mother's Family Name": '',
		"Mother's Given Name": '',
		"Father's Given Name": '',
		"Father's Family Name": '',
		'Marital Status': '',
		Confidentiality: '',
		'Deceased Date': '',
		Ethnicity: '',
		Language: '',
		Race: '',
	};

	guarantor = {
		Name: '',
		'Relation to Patient': '',
		'Email Address': '',
		'Phone Number': '',
		Address: '',
	};

	contactInfo = {
		Email: '',
		Phone: '',
	};

	emergencyContacts = {
		Name: '',
		Email: '',
		Phone: '',
	};

	address = {
		Country: '',
		'State/Province': '',
		'ZIP/Postal Code': '',
		City: '',
		'Address Line': '',
	};

	patientActivityDO = {
		'Date/Time': '',
		'Activity Type': '',
		'Call Type': '',
		'Login Email': '',
		'User Name': '',
		Comments: '',
	};

	patientNotes = '';

	coverages = [
		{
			'Payer Name': '',
			'Payer ID': '',
			'Group Number': '',
			'Member ID': '',
		},
	];

	alerts = {
		TBD: 'TBD',
	};

	allergies = [
		{
			'Offending Agent': '',
			'Offending Agent Drug Code': '',
			'Reaction Type': '',
			'Start Date': '',
			Severity: '',
			'React Description': '',
			'Recorded Date': '',
			Note: '',
		},
	];
}

export const patientDO = new PatientDO();
