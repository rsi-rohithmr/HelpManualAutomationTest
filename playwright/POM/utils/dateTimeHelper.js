import moment from 'moment';

class DateTimeHelper {
	formatDateTime(date, format) {
		const dateFormat = format ?? 'MM/DD/YYYY | hh:mm A';
		return moment(date).format(dateFormat);
	}
}

export const dateTimeHelper = new DateTimeHelper();
