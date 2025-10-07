import cloneDeep from 'lodash/cloneDeep';
import { faker } from '@faker-js/faker';
import { ordersetDO } from 'playwright/dataObjects/ordersetDO';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';

class OrderSetGenerator {
	async generateOrderSetFormValues(procedureCode) {
		const utilFuncs = new postStudyNGetToken();

		const randNum = utilFuncs.generateRandomNumber(1000, 9999);
		const orderSetDetails = cloneDeep(ordersetDO);

		orderSetDetails['Order Set Code'] = `ORDSET${randNum}`;
		orderSetDetails.Description = `E2E Test Order Set ${randNum}`;

		orderSetDetails.Anatomic = 'ACETABULUM';
		orderSetDetails['Body Part'] = 'Abdomen and Pelvis';
		orderSetDetails.Laterality = 'Bilateral';
		orderSetDetails.Modality = 'AU';
		orderSetDetails.Modifiers = ['N/A'];
		orderSetDetails.Technique = 'CLEAVAGE';
		orderSetDetails['Type Of View'] = 'AP SUPINE';

		const duration = utilFuncs.generateRandomNumber(100, 999);

		orderSetDetails['Duration (Minutes)'] = `${duration}`;
		orderSetDetails['Preparation (Minutes)'] = `${utilFuncs.generateRandomNumber(100, 999)}`;
		orderSetDetails['Recovery (Minutes)'] = `${utilFuncs.generateRandomNumber(100, 999)}`;
		orderSetDetails['Procedure Code'] = procedureCode?.code;
		orderSetDetails['Procedure Description'] = procedureCode?.display;
		orderSetDetails.Duration = `${duration}`;
		orderSetDetails.Quantity = `${utilFuncs.generateRandomNumber(10, 999)}`;

		return orderSetDetails;
	}
}

export const orderSetGenerator = new OrderSetGenerator();
