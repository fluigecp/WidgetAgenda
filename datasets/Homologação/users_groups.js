function createDataset(fields, constraints, sortFields) {
	try{
		var dataset = DatasetBuilder.newDataset(), sqlLimit, limitReturn, conRole, matGroup, colleague, filterColleague = 'NAO_ADD', filterColleagueId = 'NAO_ADD', arrList = [];
		//Criando colunas
		dataset.addColumn("colleagueId");
		dataset.addColumn("colleagueName");
		dataset.addColumn("roleId");
		if (!String.prototype.includes) {
				String.prototype.includes = function() {'use strict';
				return String.prototype.indexOf.apply(this, arguments) !== -1;
			};
		}

		//Verifica se tem filtros a serem tratados
		if (constraints !== null && constraints !== undefined && constraints.length > 0) {
			for (var index = 0; index < constraints.length; index++) {
				if (constraints[index].fieldName == 'sqlLimit') {
					sqlLimit = true;
					limitReturn = parseInt(constraints[index].initialValue);
				}
				if (constraints[index].fieldName == 'roleId') {
					conRole = DatasetFactory.createConstraint("workflowColleaguePK.roleId",constraints[index].initialValue,constraints[index].initialValue,ConstraintType.MUST) ;
				}
				if (constraints[index].fieldName == 'colleagueName') {
					filterColleague = constraints[index].initialValue;
				}
				if (constraints[index].fieldName == 'colleagueId') {
					filterColleagueId = constraints[index].initialValue;
				}
			}
		}

		if (conRole != null && conRole != undefined) {
			var role = DatasetFactory.getDataset("workflowColleagueRole", null, [conRole], null);
			if (role.rowsCount > 0 && role != undefined && role != null) {
				for (var i = 0; i < role.rowsCount; i++) {
					matGroup = DatasetFactory.createConstraint("colleaguePK.colleagueId", role.getValue(i, 'workflowColleagueRolePK.colleagueId'), role.getValue(i, 'workflowColleagueRolePK.colleagueId'), ConstraintType.MUST);

					colleague =  DatasetFactory.getDataset("colleague", null, [matGroup], null);

					arrList[arrList.length] = {'colleagueId':role.getValue(i, 'workflowColleagueRolePK.colleagueId'),'colleagueName': colleague.getValue(0, 'colleagueName'), 'roleId': role.getValue(i, 'workflowColleagueRPK.roleId')};
				}
			}
		}else{
			var role = DatasetFactory.getDataset("workflowColleagueRole", null, null, null);
			if (role.rowsCount > 0 && role != undefined && role != null) {
				for (var i = 0; i < role.rowsCount; i++) {
					matGroup = DatasetFactory.createConstraint("colleaguePK.colleagueId", role.getValue(i, 'workflowColleagueRolePK.colleagueId'), role.getValue(i, 'workflowColleagueRolePK.colleagueId'), ConstraintType.MUST);

					colleague =  DatasetFactory.getDataset("colleague", null, [matGroup], null);

					arrList[arrList.length] = {'colleagueId': role.getValue(i, 'workflowColleaguePK.colleagueId'),'colleagueName': colleague.getValue(0, 'colleagueName'), 'roleId': role.getValue(i, 'workflowColleaguePK.roleId')};
				}
			}
		}

		if ((filterColleague != 'NAO_ADD' || filterColleagueId != 'NAO_ADD') && filterColleague != undefined && filterColleague != null && filterColleagueId != undefined && filterColleagueId != null) {
			for (var i = 0; i < arrList.length; i++) {
				if (((arrList[i].colleagueName).toUpperCase()).includes(filterColleague.toUpperCase()) == true || (arrList[i].colleagueId).includes(filterColleagueId) == true ) {
					dataset.addRow(new Array(arrList[i].colleagueId, arrList[i].colleagueName, arrList[i].roleId));		
				}
			}
		}else {
			for (var i = 0; i < arrList.length; i++) {
				dataset.addRow(new Array(arrList[i].colleagueId, arrList[i].colleagueName, arrList[i].roleId));		
			}
		}
		return dataset;


	}catch(e){
		log.error('>>> >>> e.message '+e);
	}
}