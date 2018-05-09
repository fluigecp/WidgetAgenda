
function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    var filtersCard = null;
    var especFiltred = null;
    var json = [];
    var sqlLimit = null;
    var tables = [
        { tablename: "dadosSolicPscIndividual", filtersTable: null, especialidade: "PSICOLOGIA", get: ["nmrSolicPsc", "nomeAtleta", "docAtleta", "modalidade", "categoria", "dataAtendimentoPsc", "nomeProfissionalPsc", "tipoAtendimentoPsc", "compareceuPsc", "dadosSolicPsc", "anexosPsc"] },
        { tablename: "dadosSolicNutriIndividual", filtersTable: null, especialidade: "NUTRIÇÃO", get: ["nmrSolicNutri", "nomeAtleta", "docAtleta", "modalidade", "categoria", "dataAtendimentoNutri", "nomeProfissionalNutri", "tipoAtendimentoNutri", "compareceuNutri", "dadosSolicNutri", "anexosNutri"] },
        { tablename: "dadosSolicOrtopedia", filtersTable: null, especialidade: "ORTOPEDIA", get: ["nmrSolicOrtopedia", "nomeAtleta", "docAtleta", "modalidade", "categoria", "dataAtendimentoOrtopedia", "nomeProfissionalOrtopedia", "tipoAtendimentoOrtopedia", "compareceuOrtopedia", "dadosSolicOrtopedia", "anexosOrtopedia"] },
        { tablename: "dadosSolicFisiologia", filtersTable: null, especialidade: "FISIOLOGIA", get: ["nmrSolicFisiologia", "nomeAtleta", "docAtleta", "modalidade", "categoria", "dataAtendimentoFisiologia", "nomeProfissionalFisiologia", "tipoAtendimentoFisiologia", "compareceuFisiologia", "dadosSolicFisiologia", "anexosFisiologia"] },
        { tablename: "dadosSolicFisioterapia", filtersTable: null, especialidade: "FISIOTERAPIA", get: ["nmrSolicFisioterapia", "nomeAtleta", "docAtleta", "modalidade", "categoria", "dataAtendimentoFisioterapia", "nomeProfissionalFisioterapia", "tipoAtendimentoFisioterapia", "compareceuFisioterapia", "dadosSolicFisioterapia", "anexosFisioterapia"] }

    ]
    //Criando colunas
    dataset.addColumn("solicitacao");
    dataset.addColumn("atleta");
    dataset.addColumn("docAtleta");
    dataset.addColumn("modalidade");
    dataset.addColumn("categoria");
    dataset.addColumn("especialidade");
    dataset.addColumn("dataAtendimento");
    dataset.addColumn("profissional");
    dataset.addColumn("tipoAtendimento");
    dataset.addColumn("presenca");
    dataset.addColumn("dadosSolic");
    dataset.addColumn("anexos");

    //phills includes
    if (!String.prototype.includes) {
        String.prototype.includes = function () {
            'use strict';
            return String.prototype.indexOf.apply(this, arguments) !== -1;
        };
    }
    /* log.info('>>> >>> constraints: '+constraints.length) */
    //Verifica se tem filtros a serem tratados
    if (constraints !== null && constraints !== undefined && constraints.length > 0) {
        for (var index = 0; index < constraints.length; index++) {
            if (constraints[index].fieldName == 'sqlLimit') {
                sqlLimit = parseInt(constraints[index].initialValue);
            }else if (constraints[index].fieldName == 'atleta') {
                filtersCard = filtersCard === null ? [DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST)] : filtersCard;
                filtersCard.push(DatasetFactory.createConstraint("nomeAtleta", constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
            } else if (constraints[index].fieldName == 'docAtleta') {
                filtersCard = filtersCard === null ? [] : filtersCard;
                filtersCard.push(DatasetFactory.createConstraint("docAtleta", constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
            } else {
                for (var k = 0; k < tables.length; k++) {
                    tables[k].filtersTable = tables[k].filtersTable === null ? [] : tables[k].filtersTable;
                    if (constraints[index].fieldName == 'solicitacao') {
                        tables[k].filtersTable.push(DatasetFactory.createConstraint(tables[k].get[0], constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
                    } else if (constraints[index].fieldName == 'especialidade') {
                        especFiltred = (constraints[index].initialValue).toUpperCase();
                        /* log.info('>>> >>> especFiltred: '+especFiltred); */
                    } else if (constraints[index].fieldName == 'profissional') {
                        tables[k].filtersTable.push(DatasetFactory.createConstraint(tables[k].get[7], constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
                    } else if (constraints[index].fieldName == 'tipoAtendimento') {
                        tables[k].filtersTable.push(DatasetFactory.createConstraint(tables[k].get[8], constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
                    } else if (constraints[index].fieldName == 'presenca') {
                        tables[k].filtersTable.push(DatasetFactory.createConstraint(tables[k].get[9], constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
                    } else if (constraints[index].fieldName == 'dataAtendimento') {
                        tables[k].filtersTable.push(DatasetFactory.createConstraint(tables[k].get[5], constraints[index].initialValue, constraints[index].finalValue, constraints[index].constraintType));
                        if(constraints[index].likeSearch === true){
                            tables[k].filtersTable[tables[k].filtersTable.length].likeSearch = true;
                        }
                    }
                }
            }
        }
    }

    if (constraints !== null && constraints !== undefined && constraints.length === 0) {
        var c1 = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
        var dsReturn = DatasetFactory.getDataset("alimentar_prontuario", null, [c1], ['documentid']);
        for (var i = 0; i < dsReturn.rowsCount; i++) {
            for (var j = 0; j < tables.length; j++) {
                /* log.info('>>> >>> TABLENAME: '+tables[j].tablename) */
                var c5 = DatasetFactory.createConstraint("documentid", dsReturn.getValue(i, "documentid"), dsReturn.getValue(i, "documentid"), ConstraintType.MUST);
                var c6 = DatasetFactory.createConstraint("tablename", tables[j].tablename, tables[j].tablename, ConstraintType.MUST);
                var table = DatasetFactory.getDataset('alimentar_prontuario', null, [c5, c6], null);
                for (var l = 0; l < table.rowsCount; l++) {
                    
                    var column_0 = table.getValue(l, tables[j].get[0]);
                    var column_1 = dsReturn.getValue(i, tables[j].get[1]);
                    var column_2 = dsReturn.getValue(i, tables[j].get[2]);
                    var column_3 = dsReturn.getValue(i, tables[j].get[3]);
                    var column_4 = dsReturn.getValue(i, tables[j].get[4]);
                    var column_5 = tables[j].especialidade;
                    var column_6 = table.getValue(l, tables[j].get[5]);
                    var column_7 = table.getValue(l, tables[j].get[6]);
                    var column_8 = table.getValue(l, tables[j].get[7]);
                    var column_9 = table.getValue(l, tables[j].get[8]);
                    var column_10 = table.getValue(l, tables[j].get[9]);
                    var column_11 = table.getValue(l, tables[j].get[10]);
                    if(column_0 !== "" && column_1 !== "" && column_2 !== "" && column_3 !== "" && column_4 !== "" && column_5 !== "" && column_6 !== "" && column_7 !== "" && column_8 !== "" && column_9 !== "" && column_10 !== "" && column_11 !== "" ){
                        json.push({cont: column_0, obj: [parseInt(column_0), column_1, column_2, column_3, column_4, column_5, column_6, column_7, column_8, column_9, column_10, column_11] });
                    }
                    
                }
            }
        }
    } else {
        var dsReturn = DatasetFactory.getDataset("alimentar_prontuario", null, filtersCard, ['documentid']);
        for (var i = 0; i < dsReturn.rowsCount; i++) {
            for (var j = 0; j < tables.length; j++) {
                /* log.info('>>> >>> TABLENAME TESTE: '+tables[j].tablename); */
                tables[j].filtersTable = tables[j].filtersTable === null ? [] : tables[j].filtersTable;
                var c5 = DatasetFactory.createConstraint("documentid", dsReturn.getValue(i, "documentid"), dsReturn.getValue(i, "documentid"), ConstraintType.MUST);
                var c6 = DatasetFactory.createConstraint("tablename", tables[j].tablename, tables[j].tablename, ConstraintType.MUST);
                tables[j].filtersTable[tables[j].filtersTable.length] = c5;
                tables[j].filtersTable[tables[j].filtersTable.length] = c6;
                var table = DatasetFactory.getDataset('alimentar_prontuario', null, tables[j].filtersTable, null);
                for (var l = 0; l < table.rowsCount; l++) {
                    var column_0 = table.getValue(l, tables[j].get[0]);
                    var column_1 = dsReturn.getValue(i, tables[j].get[1]);
                    var column_2 = dsReturn.getValue(i, tables[j].get[2]);
                    var column_3 = dsReturn.getValue(i, tables[j].get[3]);
                    var column_4 = dsReturn.getValue(i, tables[j].get[4]);
                    var column_5 = tables[j].especialidade;
                    var column_6 = table.getValue(l, tables[j].get[5]);
                    var column_7 = table.getValue(l, tables[j].get[6]);
                    var column_8 = table.getValue(l, tables[j].get[7]);
                    var column_9 = table.getValue(l, tables[j].get[8]);
                    var column_10 = table.getValue(l, tables[j].get[9]);
                    var column_11 = table.getValue(l, tables[j].get[10]);

                    /* log.info('>>> >>> column_5: '+column_5) */
                    /* log.info('>>> >>> especFiltred: '+especFiltred) */
                    /* log.info('>>> >>> teste boolean: '+column_5 == especFiltred) */
                    log.info('>>> >>> VALORES column_0: '+column_0)
                    log.info('>>> >>> VALORES column_1: '+column_1)
                    log.info('>>> >>> VALORES column_2: '+column_2)
                    log.info('>>> >>> VALORES column_3: '+column_3)
                    log.info('>>> >>> VALORES column_4: '+column_4)
                    log.info('>>> >>> VALORES column_5: '+column_5)
                    log.info('>>> >>> VALORES column_6: '+column_6)
                    log.info('>>> >>> VALORES column_7: '+column_7)
                    log.info('>>> >>> VALORES column_8: '+column_8)
                    log.info('>>> >>> VALORES column_9: '+column_9)
                    log.info('>>> >>> VALORES column_10: '+column_10)
                    log.info('>>> >>> VALORES column_11: '+column_11)

                    if(column_0 !== "" && column_1 !== "" && column_2 !== "" && column_3 !== "" && column_4 !== "" && column_5 !== "" && column_6 !== "" && column_7 !== "" && column_8 !== "" && column_9 !== "" && column_10 !== "" && column_11 !== "" ){
                        if (column_5 == especFiltred || especFiltred === null) {
                            json.push({cont: column_0, obj: [parseInt(column_0), column_1, column_2, column_3, column_4, column_5, column_6, column_7, column_8, column_9, column_10, column_11] });
                        }
                    }
                }
            }
        }
    }


    if( json.length > 0) {
        var SortArr = function (j) {
            var arr = [];
            for (var key in j) {
                arr.push({ key: key, val: j[key] });
            }arr.sort(function (a, b) {
                var intA = parseInt(a.val.cont),
                intB = parseInt(b.val.cont);
                log.info('>>> >>> intA: '+intA)
                log.info('>>> >>> intB: '+intB)
                if (intA > intB){
                    return -1;
                }if (intA < intB){
                    return 1;
                }else{
                    return 0;
                }
            });
            for(var iti = 0; iti < arr.length; iti++){
                log.info('>>> >>> iti: '+arr[iti].val.solicitacao);
            }
            return arr;
        };
        var arrJson = SortArr(json);
        sqlLimit = (sqlLimit !== null && sqlLimit <= arrJson.length) ? sqlLimit : arrJson.length;
        for(var it = 0; it < sqlLimit; it++){
            log.info('>>> >> arrJson[it].val.obj: '+(arrJson[it].val.obj).toString())
            log.info('>>> >> KEY: '+(arrJson[it].key).toString())
            dataset.addRow(arrJson[it].val.obj);
        }
    }
    return dataset;
}