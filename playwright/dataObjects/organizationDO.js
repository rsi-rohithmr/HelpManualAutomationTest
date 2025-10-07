class OrganizationDO {
	orgIdentity = {
		organizationId: '',
		'Organization Name': '',
		'NPI/Organization ID': '',
		entityName: '',
		clientID: '',
	};

	orgGeneralDO = {
		'Organization Name': '',
		'Parent Organization': '',
		'Organization Type': '',
		'NPI/Organization ID': '',
		'Time Zone': '',
		'Corporate Website': '',
		Country: '',
		'State/Province': '',
		'Zip/Postal Code': '',
		City: '',
		'Address Line 1': '',
		'Address Line 2': '',
		Email: '',
		Phone: '',
		Fax: '',
	};

	orgInfo = {
		'Organization Name': '',
		'Organization Type': '',
		'Parent Organization': '',
		'NPI/Organization ID': '',
		'Time Zone': '',
		'Corporate Website': '',
	};

	masterOrgInfo = {
		'Organization Type': '',
		'NPI/Organization ID': '',
		'Time Zone': '',
		'Corporate Website': '',
		'Organization Name': '',
	};

	addressInfo = {
		Country: '',
		'State/Province': '',
		'Zip/Postal Code': '',
		'Address Line 1': '',
	};

	contactInfo = {
		Email: '',
		Phone: '',
		Fax: '',
	};
}

export const orgDO = new OrganizationDO();
