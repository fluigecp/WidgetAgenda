function createDataset(fields, constraints, sortFields) {
	var dataset = DatasetBuilder.newDataset();
	var filters = [];
	var sqlLimit = false;
	var limitReturn = 0;
	var filterColleague = 'NAO_ADD';
	var filterColleagueId = 'NAO_ADD';
	var arrList = [];
	dataset.addColumn("colleagueId");
	dataset.addColumn("colleagueName");
	dataset.addColumn("roleId");
	if (!String.prototype.includes) {String.prototype.includes = function() {'use strict';
			return String.prototype.indexOf.apply(this, arguments) !== -1;
		};
	}

	//Verifica se tem filtros a serem tratados
	if (constraints !== null && constraints !== undefined && constraints.length > 0) {
		for (var index = 0; index < constraints.length; index++) {
			log.warn('>>> >>> Constrantai : '+constraints[index].constraintType);
			log.warn('>>> >>> OBJECT ' + constraints[index].likeSearch);
			if (constraints[index].fieldName == 'sqlLimit') {
				sqlLimit = true;
				limitReturn = parseInt(constraints[index].initialValue);
			}
			if (constraints[index].fieldName == 'roleId') {
				let charset = constraints[index].likeSearch === true ? '%' : '';
				let conRole = DatasetFactory.createConstraint("workflowColleagueRolePK.roleId", charset + constraints[index].initialValue + charset, charset + constraints[index].finalValue + charset , constraints[index].constraintType);
				conRole.likeSearch = constraints[index].likeSearch;
				filters[filters.length] = conRole;
				
			}
			if (constraints[index].fieldName == 'colleagueName') {
				filterColleague = constraints[index].initialValue;
			}
			if (constraints[index].fieldName == 'colleagueId') {
				filterColleagueId = constraints[index].initialValue;
			}
		}
	}
	var role = DatasetFactory.getDataset("workflowColleagueRole", null, filters, null);
	for (var i = 0; i < role.rowsCount; i++) {
		var colleagueId = DatasetFactory.createConstraint("colleaguePK.colleagueId", role.getValue(i, 'workflowColleagueRolePK.colleagueId'), role.getValue(i, 'workflowColleagueRolePK.colleagueId'), ConstraintType.MUST);
		var colleague = DatasetFactory.getDataset("colleague", null, [colleagueId], null);
		if (colleague != undefined && colleague != null && colleague.rowsCount > 0) {

			arrList[arrList.length] = {'colleagueId': role.getValue(i, 'workflowColleagueRolePK.colleagueId'),'colleagueName': colleague.getValue(0, 'colleagueName'), 'roleId': role.getValue(i, 'workflowColleagueRolePK.roleId')};

			//dataset.addRow(new Array(role.getValue(i, 'workflowColleagueRolePK.colleagueId'), colleague.getValue(0, 'colleagueName'), role.getValue(i, 'workflowColleagueRolePK.roleId')));
		}
	}

	if ((filterColleague != 'NAO_ADD' || filterColleagueId != 'NAO_ADD') && filterColleague != undefined && filterColleague != null && filterColleagueId != undefined && filterColleagueId != null) {
		for (var i = 0; i < arrList.length; i++) {
			if ( ( (arrList[i].colleagueName).toUpperCase()).includes(filterColleague.toUpperCase()) == true || (arrList[i].colleagueId).includes(filterColleagueId) == true ) {
				dataset.addRow(new Array(arrList[i].colleagueId, arrList[i].colleagueName, arrList[i].roleId));		
			}
		}
	}else {
		for (var i = 0; i < arrList.length; i++) {
			dataset.addRow(new Array(arrList[i].colleagueId, arrList[i].colleagueName, arrList[i].roleId));		
		}
	}
	return dataset;
}