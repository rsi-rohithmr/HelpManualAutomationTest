class CoverageDO {
	coverageCardInfo = {
		'Payer Name': '',
		'Payer ID': '',
		'Group Number': '',
		'Member ID': '',
		'Eligibility Payer ID': '',
		'Phone Number': '',
	};

	coverageDetailsTopCardInfo = {
		'Payer ID': '',
		'Effective from': '',
	};

	coverageDetailsLeftCardInfo = {
		'Payer Name': '',
		'Employer Name': '',
		'Payer Type': '',
		'Group Number': '',
		'Coverage Status': '',
		'Employer Phone Number': '',
		'Member Relationship to Patient': '',
		'Member Name': '',
		'Member ID': '',
	};

	coverageDetailsRightCardInfo = {
		'Insurance Card': '',
		'Coverage Card': '',
	};
}

export const coverageDO = new CoverageDO();
