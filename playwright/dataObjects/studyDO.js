class StudyDO {
	studyNavigationBar = {
		'Study ID': '',
	};
	breadcrumb = {
		'Order ID': '',
		'Study ID': '',
	};
	general = {
		sectionHeader: 'General',
		'Study Status': 'N/A',
		'Study Date/Time': 'N/A',
		'Study Set Code': 'N/A',
		'Study Description': 'N/A',
		'Requested Procedure ID': 'N/A',
		'Imaging Organization': 'N/A',
		Department: 'N/A',
		'Healthcare Service': 'N/A',
		'Patient Location': 'N/A',
		'Exam Room': 'N/A',
		Modality: 'N/A',
		'Modality Modifier': 'N/A',
		'LOINC Code': 'N/A',
	};
	clinical = {
		sectionHeader: 'Clinical',
		pharmaceutical: {
			subSectionHeader: 'PHARMACEUTICAL',
			Type: 'N/A',
			'Dosage (ml)': 'N/A',
			Name: 'N/A',
		},
		scanDetails: {
			subSectionHeader: 'SCAN DETAILS',
			Laterality: 'N/A',
			'Type Of View': 'N/A',
			'Anatomic Focus': 'N/A',
			Technique: 'N/A',
			'Body Part': 'N/A',
			'Preparation (HH: MM)': '00:00',
			'Duration (HH: MM)': '00:00',
			'Recovery (HH: MM)': '00:00',
		},
		clinicalComments: {
			subSectionHeader: 'Clinical comments',
			placeHolderText: 'Enter clinical comments for the study',
			comments: '',
		},
		studyReason: {
			subSectionHeader: 'Study Reason/History',
			placeHolderText: 'Enter reason for the study',
			comments: '',
		},
		customField1: {
			subSectionHeader: 'Custom Field 1',
			placeHolderText: 'Enter your custom text',
			content: '',
		},
		customField2: {
			subSectionHeader: 'Custom Field 2',
			placeHolderText: 'Enter your custom text',
			content: '',
		},
	};
	careTeam = {
		sectionHeader: 'Care Team',
		'Performing Technologist': 'N/A',
		'Performing Physician': 'N/A',
		'Reading Physician': 'N/A',
		'Reading Organization': 'N/A',
		Transcriptionist: 'N/A',
		'Transcription Organization': 'N/A',
	};
	procedureCode = {
		sectionHeader: 'Procedure Code',
		count: 0,
		'PROCEDURE CODE': '',
		DESCRIPTION: '',
		MODIFIER: 'N/A',
		'DX CODE 0': '',
		'DX REASON 0': '',
		'DX CODE 1': '',
		'DX REASON 1': '',
	};
	studyNotes = {
		sectionHeader: 'Study Notes',
		count: 0,
		note0Header: 'Study Notes',
		note0Content: '',
		note0CreatedBy: '',
		note0CreatedDate: '',
	};
}

export const studyDO = new StudyDO();
