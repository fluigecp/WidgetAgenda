var MyWidget = SuperWidget.extend({
    urlService: WCMAPI.serverURL + "/webdesk/ECMCardService?wsdl",
    categorias: [],
    tenantCode: null,
    instanceId: null,
    agendados: null,
    bindings: {
        local: {
            professional: ['change_getConsutas'],
            agendar: ['click_openModalAgenda'],
            week_ant: ['click_montaCabecalhoTable'],
            week_pos: ['click_montaCabecalhoTable'],
            card: ['click_openModalEdit'],
            bar: ['click_openRightBar'],
            reload: ['click_getConsutas'],
        },
        //ADD EVENTOS NOS ELEMENTOS DO BODY
        global: {
            confirm: ['click_criarRegistro'],
            edit: ['click_editarInformacoes'],
            cancel: ['click_openModalCancel'],
            confirmCancel: ['click_registrarCancelamento'],
            salve: ['click_salvarEdicao'],
            search_go: ['click_searchConsultasBar']
        }
    },
    init: function () {
        let credenciais = MyWidget.getIds();
        MyWidget.login = credenciais.login;
        MyWidget.password = credenciais.password;
        MyWidget.parentId = (/ecp-teste/g).test(window.location.hostname) ? 981 : 119690;
        MyWidget.instanceId = this.instanceId;
        MyWidget.tenantCode = WCMAPI.tenantCode;
        MyWidget.objDateFirst = moment().subtract((new Date()).getDay(), 'days').locale('pt-br').format('L');
        MyWidget.objDateFirst = moment(MyWidget.objDateFirst + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss').toDate();
        $(document).ready(function () {
            //ALTERAÇÃO DO NOME DA PÁGINA
            $('h2.pageTitle').text('Agenda Médica');
            //SINALIZAÇÃO DE BUTTON CLOSE BAR RIGHT
            $('body').on({
                mouseenter: function () {
                    $(this).toggleClass('btn-danger btn-default');
                },
                mouseleave: function () {
                    $(this).toggleClass('btn-danger btn-default');
                }
            }, 'a.btn-close');
            //VERIFICANDO QUEM É O USUÁRIO LOGADO
            let roles;
            let roleIdLike;
            let usersRoles;
            let arrayProp;
            let optgroup;
            let option;
            let arrayRoles = new Object();
            let colleagueId = DatasetFactory.createConstraint("colleagueId", WCMAPI.userCode, WCMAPI.userCode, ConstraintType.MUST);
            let roleId_1 = DatasetFactory.createConstraint("roleId", "WK_MED_ADMINISTRACAO", "WK_MED_ADMINISTRACAO", ConstraintType.SHOULD);
            let roleId_2 = DatasetFactory.createConstraint("roleId", "WK_MED_RECEPCAO", "WK_MED_RECEPCAO", ConstraintType.SHOULD);
            let ds_roles = DatasetFactory.getDataset("users_roles", null, [colleagueId, roleId_1, roleId_2], null);
            if (ds_roles.values.length > 0) {
                roleIdLike = DatasetFactory.createConstraint("roleId", "WK_MED_", "WK_MED_", ConstraintType.MUST);
                roleIdLike._likeSearch = true;
                usersRoles = DatasetFactory.getDataset("users_roles", null, [roleIdLike], null);
                for (let j = 0; j < usersRoles.values.length; j++) {
                    let roleName = (usersRoles.values[j].roleId).split('_')[2];
                    roleName = roleName === 'NUTRICAO' ? 'NUTRIÇÃO' : roleName;
                    if (roleName !== 'Gestores' && roleName !== 'Gestor' && roleName !== 'ADMINISTRACAO' && roleName !== 'RECEPCAO') {
                        if (arrayRoles.hasOwnProperty(roleName) == false) {
                            arrayRoles[roleName] = {
                                medico: [{
                                    nome: usersRoles.values[j].colleagueName,
                                    matricula: usersRoles.values[j].colleagueId
                                }]
                            }
                        } else {
                            arrayRoles[roleName].medico.push({
                                nome: usersRoles.values[j].colleagueName,
                                matricula: usersRoles.values[j].colleagueId
                            });
                        }
                    }
                }
            } else {
                roleIdLike = DatasetFactory.createConstraint("roleId", "WK_MED_", "WK_MED_", ConstraintType.MUST);
                roleIdLike._likeSearch = true;
                roles = DatasetFactory.getDataset("users_roles", null, [colleagueId, roleIdLike], null);
                for (let j = 0; j < roles.values.length; j++) {
                    roleId = DatasetFactory.createConstraint("roleId", roles.values[j].roleId, roles.values[j].roleId, ConstraintType.MUST);
                    usersRoles = DatasetFactory.getDataset("users_roles", null, [roleId], null);
                    for (let l = 0; l < usersRoles.values.length; l++) {
                        roleName = (usersRoles.values[l].roleId).split('_')[2];
                        if (arrayRoles.hasOwnProperty(roleName) == false) {
                            arrayRoles[roleName] = {
                                medico: [{
                                    nome: usersRoles.values[l].colleagueName,
                                    matricula: usersRoles.values[l].colleagueId
                                }]
                            }
                        } else {
                            arrayRoles[roleName].medico.push({
                                nome: usersRoles.values[l].colleagueName,
                                matricula: usersRoles.values[l].colleagueId
                            });
                        }
                    }
                }
            }
            arrayProp = Object.getOwnPropertyNames(arrayRoles);
            for (let k = 0; k < arrayProp.length; k++) {
                optgroup = null;
                for (let l = 0; l < arrayRoles[arrayProp[k]].medico.length; l++) {
                    optgroup = optgroup === null ? document.createElement("optgroup") : optgroup;
                    optgroup.setAttribute("label", (arrayProp[k]).toLowerCase());
                    option = document.createElement("option");
                    option.text = arrayRoles[arrayProp[k]].medico[l].nome;
                    option.value = arrayRoles[arrayProp[k]].medico[l].nome;
                    option.setAttribute("data-matricula", arrayRoles[arrayProp[k]].medico[l].matricula);
                    option.setAttribute("data-especialidade", (arrayProp[k]).toLowerCase());
                    option.setAttribute("data-tokens", (arrayProp[k] + ' ' + arrayRoles[arrayProp[k]].medico[l].nome + ' ' + arrayRoles[arrayProp[k]].medico[l].matricula));
                    optgroup.appendChild(option);
                }
                $('.selectpicker').append(optgroup);
            }
            $('body').on('blur', 'input[data-calendar=horas].fs-no-bg', function (event) {
                MyWidget.calculaTempo(this);
            });
            //FUNÇÃO PARA ADIÇÃO PICKEDATE
            $('body').on('mousedown', 'input[data-calendar].fs-no-bg', function (event) {
                if ($(this).data('calendar') === 'data') {
                    MyWidget.calendar = FLUIGC.calendar('[name=' + this.name + ']', {
                        language: 'pt-br',
                        pickDate: true,
                        pickTime: false,
                        useCurrent: false,
                        showToday: true,
                        defaultDate: "",
                        disabledDates: [],
                        useStrict: true,
                        formatDate: 'DD/MM/YYYY',
                        daysOfWeekDisabled: [0, 6]
                    });
                } else if ($(this).data('calendar') === 'horas') {
                    MyWidget.horas = FLUIGC.calendar('[name=' + this.name + ']', {
                        language: 'pt-br',
                        pickDate: false,
                        pickTime: true,
                        useMinutes: true,
                        useSeconds: false,
                        useCurrent: false,
                        minDate: moment({
                            h: 7,
                            m: 00
                        }),
                        maxDate: moment({
                            h: 22,
                            m: 00
                        }),
                        defaultDate: moment({
                            h: 12,
                            m: 00
                        }),
                        minuteStepping: 30,
                        useStrict: true,
                        formatDate: 'HH:MM'
                    });
                }
            });
            //SETA O TEXTO DE DESCRIÇÃO INSERIDA PELO TECLADO EM UPPER CASE
            $('body').on('keyup', 'input[data-upper]', function (event) {
                event.preventDefault();
                $(this).val(($(this).val()).toUpperCase());
            });
            //SETA EVENTO PARA CLIQUE NO X DE FECHAR BAR RIGHT
            $('body').on('click', '[data-close-bar],div.rightbar-backdrop', function () {
                var that = this
                $('#divRightBar').animate({
                    'width': '0'
                }, 200, function () {
                    $('#divRightBar').hide();
                    $('body').find('div.rightbar-backdrop').remove();
                });
                $('body').css('overflow-y', 'auto');
                setTimeout(function () {
                    $('#divRightBar').closest('div.fluig-style-guide').remove();
                }, 300);
            });
            $('.dropdown-submenu a.drop-submenu').on("click", function (e) {
                $(this).next('ul').toggle();
                e.stopPropagation();
                e.preventDefault();
            });
            $('li[data-none], button[data-none]').on('click', function () {
                $('ul.dropdown-menu.drop-seg:visible').css('display', 'none');
            });
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
                $('.selectpicker').selectpicker('mobile');
            }
        });
        $(window).load(function () {
            //ADD SCROLL IN TABELA DA AGENDA
            $('#table-hours_' + MyWidget.instanceId).DataTable({
                scrollY: '83vmin',
                scrollCollapse: true,
                paging: false,
                searching: false,
                ordering: false,
                info: false,
                fixedHeader: true
            });
            $('div.dataTables_scrollHeadInner').css("padding-right", "0");
            
            //SETANDO DATAS NO CABEÇALHO DA TABELA
            MyWidget.montaCabecalhoTable();
        });
    },
    //MONTA AS DATAS DO CABEÇALHO
    montaCabecalhoTable: function (htmlElement, event) {
        let date;
        let evt = event === undefined ? event : event.type;
        MyWidget.btn_load = null;
        if (evt === 'click') {
            $('div.dataTables_scrollBody table').find('div.card-consuta').remove();
            MyWidget.btn_load = $('[data-week_pos], [data-week_ant]');
            MyWidget.btn_load.button('loading');
            if ($(htmlElement).hasClass('anterior')) {
                MyWidget.objDateFirst = moment(MyWidget.objDateFirst).subtract(7, 'days').toDate();
            } else {
                MyWidget.objDateFirst = moment(MyWidget.objDateFirst).add(7, 'days').toDate();
            }
        }
        setTimeout(function () {
            for (let i = 0; i < 7; i++) {
                date = moment(MyWidget.objDateFirst).add(i, 'days').toDate(),
                    dia = moment(date).locale('pt-br').format('DD'),
                    week = moment(date).locale('pt-br').format('ddd'),
                    month = moment(date).locale('pt-br').format('MMM'),
                    year = moment(date).locale('pt-br').format('YYYY'),
                    dataFormated = moment(date).locale('pt-br').format('L');
                month = month.toLowerCase().replace(/(?:^)\S/g, function (a) {
                    return a.toUpperCase();
                })
                $('div.dataTables_scrollHeadInner table').find('thead tr th:not(:first()):eq(' + i + ') div.dayofmonth').html(dia);
                $('div.dataTables_scrollHeadInner table').find('thead tr th:not(:first()):eq(' + i + ') div.dayofweek').html(week);
                $('div.dataTables_scrollHeadInner table').find('thead tr th:not(:first()):eq(' + i + ') div.shortdate').html(month + ', ' + year);
                $('div.dataTables_scrollHeadInner table').find('thead tr th:not(:first()):eq(' + i + ') div.date-format').html(dataFormated);
            }
            if (evt === 'click') {
                MyWidget.getConsutas();
            }
        }, 100);
    },
    //FAZ REQUISIÇÃO AO DATASET DAS CONSULTAS DA SEMANA E MONTA A AGENDA COM OS RETORNOS    
    getConsutas: function (htmlElement, event) {
        MyWidget.loadBodyTable = FLUIGC.loading('div.dataTables_scroll');
        MyWidget.loadBodyTable.show();
        setTimeout(function () {
            $('div.dataTables_scrollBody table').find('div.card-consuta').remove();
            MyWidget.matProfissional = $('.selectpicker').find('option:selected').data('matricula');
            //GET MODEL DE CARD IN HTML'S IN FOLDER JS
            for (let m = 0; m < 7; m++) {
                let _card = MyWidget.requestAJAX('cardAgenda', 'html');
                let td = null;
                let card;
                let datePesquisa = moment(MyWidget.objDateFirst).add(m, 'days').toDate();
                let dataFormated = moment(datePesquisa).locale('pt-br').format('L');
                let filtersConsulta = [];
                let metadata = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
                let profissional = DatasetFactory.createConstraint("matMedico", MyWidget.matProfissional + '', MyWidget.matProfissional + '', ConstraintType.MUST);
                filtersConsulta[0] = metadata;
                filtersConsulta[1] = profissional;
                filtersConsulta[2] = DatasetFactory.createConstraint("consultaCancelada", "false", "false", ConstraintType.MUST);
                filtersConsulta[3] = DatasetFactory.createConstraint("dateInicio", dataFormated.toString(), dataFormated.toString(), ConstraintType.MUST);
                let ds_consultas = DatasetFactory.getDataset("agendamento_consultas", null, filtersConsulta, null);

                //dataset de restrições
                let fitersRestricao = [];
                fitersRestricao[0] = metadata;
                fitersRestricao[1] = profissional;
                fitersRestricao[2] = DatasetFactory.createConstraint("arrayDates", '%' + dataFormated.toString() + '%', '%' + dataFormated.toString() + '%', ConstraintType.MUST);
                fitersRestricao[2]._likeSearch = true;
                fitersRestricao[3] = DatasetFactory.createConstraint("bloqueioCancelado", 'false', 'false', ConstraintType.MUST);
                let ds_restricoes = DatasetFactory.getDataset("cadastro_restricoes", null, fitersRestricao, null);
                if (ds_consultas.columns[0] === 'Mensagem' || ds_restricoes.columns[0] === 'Mensagem') {
                    if ($('div#toaster').find('div.alert').length === 0) {
                        MyWidget.setToast('Atenção! ', ds_consultas.values[0].Mensagem, 'danger', 4000);
                    }
                } else {
                    if (htmlElement !== undefined) {
                        $(htmlElement).val() !== '' ? $('div#cj-btns').slideDown('slow') : '';
                    }
                    for (let o = 0; o < ds_consultas.values.length; o++) {
                        let tdsClass = (ds_consultas.values[o].tdClass).split(',');
                        for (let z = 0; z < tdsClass.length; z++) {
                            card = _card.clone();
                            td = $('div.dataTables_scrollBody table tr.' + tdsClass[z]).find('td.day-' + m + ' div:eq(0)');
                            card.width(td.width() - 10);
                            card.css('background-color', ds_consultas.values[o].colorAgenda);
                            let arrayObj = Object.getOwnPropertyNames(ds_consultas.values[o]);
                            for (let p = 0; p < arrayObj.length; p++) {
                                if (arrayObj[p] == 'descricao') {
                                    let descricao = ds_consultas.values[o].descricao;
                                    if (ds_consultas.values[o].codFormulario === 'formAtendimentoEquipe') {
                                        card.find('#descricao').text(descricao.replace(/,/g, ', '));
                                    } else {
                                        card.find('#descricao').text(descricao);
                                    }
                                } else {
                                    card.find('#' + arrayObj[p]).text(ds_consultas.values[o][arrayObj[p]]);
                                }
                            }
                            td.append(card);
                        }
                    }
                    for (let o = 0; o < ds_restricoes.values.length; o++) {
                        let tdsClass = (ds_restricoes.values[o].tdClass).split(',');
                        for (let z = 0; z < tdsClass.length; z++) {
                            card = _card.clone();
                            td = $('div.dataTables_scrollBody table tr.' + tdsClass[z]).find('td.day-' + m + ' div:eq(0)');
                            card.width(td.width() - 10);
                            card.css('background-color', ds_restricoes.values[o].colorAgenda);
                            card.removeAttr('data-card');
                            card.removeClass('fs-cursor-pointer');
                            let descricao = ds_restricoes.values[o].motivo;
                            card.find('#descricao').text(descricao);
                            td.append(card);
                        }
                    }
                }
            }
            if (MyWidget.btn_load !== null) {
                MyWidget.btn_load.button('reset');
            }
            MyWidget.loadBodyTable.hide();
        }, 100);
    },
    //FAZ REQUISIÇÃO DOS DOC SUPORTE VIA AJAX PARA CONSUMO
    requestAJAX: function (arquivo, typeArquivo) {
        let aRetorno;
        $.ajax({
            url: '/AgendaMedica/resources/js/' + typeArquivo + 's/' + arquivo + '.' + typeArquivo,
            async: false,
            type: 'get',
            datatype: typeArquivo + ',charset=utf-8',
            success: function (retorno) {
                aRetorno = $(retorno);
            }
        });
        return aRetorno;
    },
    //CREATE TOAST IN WINDOW
    setToast: function (titulo, mensagem, tType, timeout) {
        FLUIGC.toast({
            title: titulo,
            message: mensagem,
            type: tType,
            timeout: timeout
        });
        if (tType === 'danger') {
            let qtd = $('div#toaster').find('div.alert').length;
            setTimeout(function () {
                let $obj = $('div#toaster').find('div.alert.alert-danger.alert-dismissible:eq(0)');
                $obj.slideUp('slow', function () {
                    $obj.remove();
                });
            }, qtd * timeout);
        }
    },
    //SETA PORPIEDADES DOS CAMPOS TIPO ZOOM
    setPropFilter: function (campo) {
        let arrayZoom = {
            'nameAtleta': {
                coluna: 'NOME',
                dataset: 'wsAtletas',
                title: 'Nome'
            },
            'modalidadeAtleta': {
                coluna: 'SECAO',
                dataset: 'wsSecao',
                title: 'Seção'
            }
        };
        let settings = {
            source: {
                url: '/api/public/ecm/dataset/search?datasetId=' + arrayZoom[campo].dataset + '&searchField=' + arrayZoom[campo].coluna + '&',
                contentType: 'application/json',
                root: 'content',
                pattern: '',
                limit: 7,
                offset: 0,
                patternKey: 'searchValue',
                limitkey: 'limit',
                offsetKey: 'offset'
            },
            displayKey: arrayZoom[campo].coluna,
            multiSelect: false,
            style: {
                autocompleteTagClass: 'tag-gray',
                tableSelectedLineClass: 'info'
            },
            table: {
                header: [{
                    'title': arrayZoom[campo].title,
                    'size': 'col-xs-9',
                    'dataorder': arrayZoom[campo].coluna,
                    'standard': true
                }],
                renderContent: [arrayZoom[campo].coluna]
            }
        };
        MyWidget[campo] = FLUIGC.filter('input[name=' + campo + ']', settings);
        if (campo === 'nameAtleta') {
            MyWidget[campo].on('fluig.filter.itemAdded', function (event) {
                var objLine = MyWidget.nameAtleta.getSelectedItems();
                $('body form.modal-content').find('input[name=matAtleta]').val(objLine[0].MATRICULA);
                $('body form.modal-content').find('input[name=modalidadeAtleta]').val(objLine[0].SECAO);
                $('body form.modal-content').find('input[name=categoriaAtleta]').val(objLine[0].CATEGORIA);
                $('body form.modal-content').find('input[name=descricao]').val(objLine[0].NOME);
            });
            MyWidget[campo].on('fluig.filter.itemRemoved ', function (event) {
                $('body form.modal-content').find('input[name=matAtleta], input[name=modalidadeAtleta], input[name=categoriaAtleta], input[name=descricao]').val('');
            });
        } else if (campo === 'modalidadeAtleta') {
            MyWidget[campo].on('fluig.filter.itemAdded', function (event) {
                MyWidget.categorias = [];
                let c1 = DatasetFactory.createConstraint('SECAO', ($('[name=modalidadeAtleta]').val()).toUpperCase(), ($('[name=modalidadeAtleta]').val()).toUpperCase(), ConstraintType.MUST);
                let ds_categoria = DatasetFactory.getDataset('wsCategorias', ['CATEGORIA'], [c1], ['CATEGORIA']);
                for (let i = 0; i < ds_categoria.values.length; i++) {
                    MyWidget.categorias.push(ds_categoria.values[i].CATEGORIA);
                }
                MyWidget.setPropAutocomplete('categoriaAtleta');
            });
            MyWidget[campo].on('fluig.filter.itemRemoved', function (event) {
                MyWidget.categorias = ['Sem valor na modalidade'];
                MyWidget.categoriaAutocomplete.removeAll();
                MyWidget.setPropAutocomplete('categoriaAtleta');
            });
        }
    },
    //SETA PORPIEDADES DOS CAMPOS TIPO AUTOCOMPLETE
    setPropAutocomplete: function (name) {
        MyWidget.categoriaAutocomplete = FLUIGC.autocomplete('input[name=' + name + ']', {
            source: substringMatcher(),
            name: 'wsCategorias',
            displayKey: 'CATEGORIA',
            tagClass: 'tag-gray',
            type: 'tagAutocomplete',
            maxTags: 5,
            highlight: true
        });

        function substringMatcher() {
            return function findMatches(q, cb) {
                var matches, substrRegex;
                matches = [];
                substrRegex = new RegExp(q, 'i');
                $.each(MyWidget.categorias, function (i, str) {
                    if (substrRegex.test(str)) {
                        matches.push({
                            CATEGORIA: str
                        });
                    }
                });
                cb(matches);
            };
        }
    },
    //CALCULA O TEMPO DA CONSULTA
    calculaTempo: function ($this) {
        let numThis = ($($this).val()).replace(':', '');
        numThis = parseInt(numThis);
        if (numThis < 800 || numThis > 2230) {
            $('input[name=tempoConsulta]').val('--:--');
            $($this).val('');
            MyWidget.setToast('Opss! ', 'Horário selecionado não atendo ao intervalo de atendimento, sendo das 08:00 às 22:00 horas.', 'danger', 4000);
        } else if ($('input[name=hourInicio]').val() !== '' && $('input[name=hourFinal]').val() !== '') {
            let arrayHoras = {
                inicio: ($('input[name=hourInicio]').val()).split(':'),
                fim: ($('input[name=hourFinal]').val()).split(':')
            };
            let momentInicial = moment().set({
                'hour': parseInt(arrayHoras.inicio[0]),
                'minute': parseInt(arrayHoras.inicio[1]),
                'second': 0,
                'millisecond': 0
            });
            let momentFinal = moment().set({
                'hour': parseInt(arrayHoras.fim[0]),
                'minute': parseInt(arrayHoras.fim[1]),
                'second': 0,
                'millisecond': 0
            });
            let objDiffHours = momentFinal.diff(momentInicial);
            objDiffHours = moment.duration(objDiffHours);
            if ((objDiffHours._data.hours === 0 && objDiffHours._data.minutes === 30) || (objDiffHours._data.hours > 0 && (objDiffHours._data.minutes === 0 || objDiffHours._data.minutes === 30))) {
                let qtdHour = objDiffHours._data.hours < 10 ? '0' + objDiffHours._data.hours : objDiffHours._data.hours;
                let qtdMinute = objDiffHours._data.minutes < 10 ? '0' + objDiffHours._data.minutes : objDiffHours._data.minutes;
                $('input[name=tempoConsulta]').val(qtdHour + ':' + qtdMinute);
            } else {
                $('input[name=tempoConsulta]').val('--:--');
                $('input[name=hourFinal]').val('');
                MyWidget.setToast('Opss! ', 'Verificar inconsistência nos horários da consulta', 'danger', 4000);
            }
        }
    },
    //CHAMADA DO MODAL DE AGENDAMENTO
    openModalAgenda: function (htmlElement, event) {
        let dataType = $(htmlElement).data('form');
        let content = MyWidget.requestAJAX(dataType, 'html');
        let nameMedico = $('.selectpicker').find('option:selected').val();
        MyWidget.data_color = $(htmlElement).data('color');
        MyWidget.data_type = $(htmlElement).data('type');
        MyWidget.data_form = $(htmlElement).data('form');
        $('body').addClass('scroll-hidden');
        MyWidget.modalAgendamento = FLUIGC.modal({
            title: 'Agendar Consulta para o profissional ' + nameMedico,
            content: $(content[0]).html(),
            id: 'modal-agendamento',
            formModal: true,
            size: 'full',
            actions: [{
                'buttonType': 'button',
                'classType': 'btn-primary agendar'
            }, {
                'autoClose': true,
                'buttonType': 'button',
                'classType': 'btn-danger cancelar'
            }]
        }, function (err, data) {
            if (err === null) {
                $('div#modal-agendamento button.btn-danger.cancelar').html('<i class="fluigicon fluigicon-remove"></i>&nbsp; Cancelar');
                $('div#modal-agendamento button.btn-primary.agendar').html('<i class="fluigicon fluigicon-calendar-verified"></i>&nbsp; Agendar Consulta');
                //SETA VALOR NO INPUT DE TEMPOD E CONSULTA
                $('input[name=tempoConsulta]').val('--:--');
                //REMOVE BOTÃO DE FECHAR MODAL
                $('div.modal-header').find('button.close').remove();
                //MUDA O TYPE DO BOTÃO AGENDA E ATRIBUI UM DATA-CONFIRM PARA BINDING DE FUNÇÕES
                $('div.modal-footer').find('button[type=submit]').attr({
                    'type': 'button',
                    'data-confirm': ''
                });
                //VERIFICA SE EXISTE CAMPO FILTER NO DATA DO MODAL
                if ($(data).find('input[data-filter]').length > 0) {
                    MyWidget.setPropFilter($(data).find('input[data-filter]').attr('name'));
                }
                //INSTANCIA O OBJETO SWITCHER DO MODAL E ATRIBUI EVENTO AO MESMO
                MyWidget.switcher = FLUIGC.switcher.init('input[name=haRecorrencia]');
                FLUIGC.switcher.onChange('[name=haRecorrencia]', function (event, state) {
                    if (state) {
                        $('div.recorrencia-data').show('slow');
                    } else {
                        $('div.recorrencia-data').hide('slow');
                        $('div.recorrencia-data').find('input, select').val('');
                    }
                });
                //BLOQUEIA A ENTRADA DE VALORES ACIMA DE 21 E ABAIXO DE 2
                $("[name=qtdRecorrencia]").on("input", function (e) {
                    if (parseInt(this.value) > parseInt(this.max)) {
                        this.value = this.max
                    } else if (parseInt(this.value) < parseInt(this.min)) {
                        this.value = this.min
                    }
                });
                $('#modal-agendamento').on('hide.bs.modal', function (event) {
                    $('body').removeClass('scroll-hidden');
                    if (MyWidget.reload) {
                        MyWidget.getConsutas(this);
                    }
                });
            }
        });
    },
    //VALIDA FORMULÁRIO DO MODAL
    validarForm: function (data) {
        let requireds = $('div.modal-body').find('[' + data + ']:visible,[' + data + '=zoom]')
        let valida = false;
        $.each(requireds, function (index, val) {
            if ($(this).val() === '' || $(this).val() === null) {
                valida = true;
            }
        });
        return valida;
    },
    //CALCULA A QUANTIDADE DE MEIA HORA QUE EXISTE NO INTERVALO E MONTA O ARRAY DE TDSCLASS
    calculaClasses: function (dataInicio, horaInicio, horaFim) {
        let tdsClass = [];
        let objDateInicio = moment((dataInicio + ' ' + horaInicio), "DD/MM/YYYY HH:mm");
        let ms = moment((dataInicio + ' ' + horaFim), "DD/MM/YYYY HH:mm").diff(objDateInicio);
        let d = moment.duration(ms);
        let intervaloHoras = Math.round((d._data.hours) * 2);
        d._data.minutes !== 0 ? intervaloHoras++ : intervaloHoras;
        objDateInicio = objDateInicio.toDate();
        for (var i = 0; i < intervaloHoras; i++) {
            let classe = moment(objDateInicio).add((30 * i), 'minutes').locale('pt-br').format('LT')
            tdsClass.push(classe.replace(':', ''));
        }
        return tdsClass;
    },
    //REALIZAR CRIAÇÃO DA FICHA DE AGENDAMENTO E RELOAD DE AGENDA
    criarRegistro: function (htmlElement, event) {
        MyWidget.loadBodyModal = FLUIGC.loading('div#modal-agendamento');
        MyWidget.loadBodyModal.show();
        MyWidget.reload = null;
        setTimeout(a => {
            var parser = new DOMParser();
            let horaInicio = $('div#modal-agendamento').find('input#hourInicio').val();
            let horaFim = $('div#modal-agendamento').find('input#hourFinal').val();
            if (MyWidget.validarForm('data-required')) {
                MyWidget.setToast('Opss! ', 'Os campos sinalizados com * são de preenchimento obrigatório.', 'danger', 4000);
                MyWidget.loadBodyModal.hide();
                return false;
            } else if (((parseInt(horaInicio.replace(':', '')) < 800 || parseInt(horaInicio.replace(':', '')) > 2230) && horaInicio !== '')) {
                MyWidget.setToast('Opss! ', 'O horário de ínicio da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e menor que o horário de término.', 'danger', 4000);
                MyWidget.loadBodyModal.hide();
                return false;
            } else if ((parseInt(horaFim.replace(':', '')) < 800 || parseInt(horaFim.replace(':', '')) > 2230) && horaFim !== '') {
                MyWidget.setToast('Opss! ', 'O horário de término da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e maior que o horário de ínicio.', 'danger', 4000);
                MyWidget.loadModalEdit.hide();
                return false;
            } else {
                let presenca = false,
                    consultaRealizada, _xml, tempoConsulta, loop, tdsClass = [], filtersRestricao = [], create = true, log = { content: [] };
                let recorrenciaDatas = $('div#modal-agendamento').find('input#haRecorrencia').is(':checked');
                let tipoRecorrencia = recorrenciaDatas ? $('div#modal-agendamento').find('select#tipoRecorrencia').val() : '';
                let dataInicio = $('div#modal-agendamento').find('input#dateInicio').val();
                let especialidade = $('.selectpicker').find('option:selected').data('especialidade');
                let token = MyWidget.generateToken();
                //let matProfissional =  MyWidget.matProfissional - UTILIZAR A VAR GLOBAL DA SUPERCLASS

                //CALCULA A QUANTIDADE DE MEIA HORA QUE EXISTE NO INTERVALO SELECIONADO;            
                tdsClass = MyWidget.calculaClasses(dataInicio, horaInicio, horaFim);

                //VERIFICA SE A CONSULTA JÁ OCORREU E SETA ESSAS INFORMAÇÕES NO FORM QUE SERÁ ENVIADO PARA SERVER
                let objDateInicio = moment(dataInicio + ' ' + horaInicio, 'DD/MM/YYYY HH:mm').toDate();
                let typeSolic = moment(objDateInicio).isAfter(new Date()) ? 'Normal' : 'Retroativa'
                if (typeSolic == 'Normal') {
                    consultaRealizada = false;
                } else {
                    consultaRealizada = true;
                    recorrenciaDatas = false;
                    tipoRecorrencia = '';
                    FLUIGC.switcher.setFalse('input[name=haRecorrencia]');
                    $('div.recorrencia-data').hide('slow');
                    $('div#modal-agendamento').find('#tipoRecorrencia, #qtdRecorrencia').val('');
                }
                //CALCULA A QUANTIDADE DE LOOP QUE O FOR SERÁ EXECUTADO
                loop = recorrenciaDatas ? parseInt($('div#modal-agendamento').find('input#qtdRecorrencia').val()) : 1;

                //VERIFICA SE HÁ RESTRIÇÕES NO RANGE DE DATAS INDICADA;
                filtersRestricao[0] = DatasetFactory.createConstraint('bloqueioCancelado', 'false', 'false', ConstraintType.MUST);
                filtersRestricao[1] = DatasetFactory.createConstraint('matMedico', MyWidget.matProfissional, MyWidget.matProfissional, ConstraintType.MUST);
                for (let z = 0; z < loop; z++) {
                    let addDays = tipoRecorrencia === '' || tipoRecorrencia === 'Diária' ? z : 7 * z;
                    let date = moment(dataInicio, 'DD/MM/YYYY').add(addDays, 'days').locale('pt-br').format('L');
                    filtersRestricao[filtersRestricao.length] = DatasetFactory.createConstraint('arrayDates', '%' + date + '%', '%' + date + '%', ConstraintType.SHOULD);
                    filtersRestricao[filtersRestricao.length - 1]._likeSearch = true;
                }
                let ds_restricoes = DatasetFactory.getDataset('cadastro_restricoes', null, filtersRestricao, null);

                if (ds_restricoes !== undefined && ds_restricoes !== null && ds_restricoes.values.length > 0) {
                    let retorno = ds_restricoes.values
                    for (let y = 0; y < retorno.length; y++) {
                        if ((retorno[y].tdClass).indexOf(horaInicio.replace(/\:/gi, '')) > -1 || (retorno[y].tdClass).indexOf(horaFim.replace(/\:/gi, '')) > -1) {
                            create = false;
                            log.content.push({ dataInicio: retorno[y].dataInicial, horaInicio: retorno[y].horaInicial, datafim: retorno[y].dataFinal, horaFim: retorno[y].horaFinal, descricao: retorno[y].motivo });
                        }
                    }
                }
                if (create) {
                    //REQUISIÇÃO VIA AJAX XML PADRÃO WEBSERVICE
                    _xml = MyWidget.requestAJAX('ECMCardService_Create', 'xml');

                    //PREENCHE OS CAMPOS DO XML COM AS INFORMAÇÕES QUE JÁ ESTÃO CONTIDAS NO MODAL, EVITANDO CARREGAR VÁRIAS VARIÁVEIS
                    $('div#modal-agendamento').find('div.modal-body [data-value]').each(function (index, val) {
                        _xml.find('[name=' + this.name + ']').text(this.value);
                    });

                    //PREENCHE O CAMPO DESCRIÇÃO CASO NÃO SEJA DO TIPO OUTROS, POIS O CAMPO É UTILIZADO COMO CAMPO DESCRITOR DO FORMULÁRIO
                    if (_xml.find('[name=descricao]').text() === '') {
                        if (MyWidget.data_form === 'formAtendimentoEquipe') {
                            _xml.find('[name=descricao]').text(_xml.find('[name=modalidadeAtleta]').text() + ' - ' + _xml.find('[name=categoriaAtleta]').text());
                        } else {
                            _xml.find('[name=descricao]').text(_xml.find('[name=nameAtleta]').text());
                        }
                    }
                    // MyWidget.data_color - VARIÁVEL GLOBAL;
                    // MyWidget.data_type - VARIÁVEL GLOBAL;
                    // MyWidget.data_form - VARIÁVEL GLOBAL;
                    //PREENCHE OS DEMAIS CAMPOS DO XML DEVIDO NÃO TER TODOS OS DADOS NO MODAL
                    _xml.find('[name=dateCreate]').text(moment().locale('pt-br').format('L'));
                    _xml.find('[name=haRecorrencia]').text(recorrenciaDatas);
                    _xml.find('[name=consultaCancelada]').text('false');
                    _xml.find('[name=consultaRealizada]').text(consultaRealizada);
                    _xml.find('[name=atletaFaltou]').text(presenca);
                    _xml.find('[name=especialidade]').text(especialidade.toUpperCase());
                    _xml.find('[name=tokenFicha]').text(token);
                    _xml.find('[name=tdClass]').text(tdsClass.toString());
                    _xml.find('[name=matMedico]').text(MyWidget.matProfissional);
                    _xml.find('[name=colorAgenda]').text(MyWidget.data_color);
                    _xml.find('[name=typeConsulta]').text(MyWidget.data_type);
                    _xml.find("[name=codFormulario]").text(MyWidget.data_form);
                    _xml.find("[name=typeSolic]").text(typeSolic);
                    _xml.find("companyId").text(MyWidget.tenantCode);
                    _xml.find("username").text(MyWidget.login);
                    _xml.find("password").text(MyWidget.password);
                    _xml.find("parentDocumentId").text(MyWidget.parentId);
                    _xml.find("[name=logAlteracao]").text(moment(new Date()).locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Consulta agendada');
                    //ITERAÇÃO DE CRIAÇÃO DAS FICHAS RECORRENTES
                    let numRecorrencia = 1;
                    for (let i = 0; i < loop; i++) {
                        let addDays = tipoRecorrencia === '' || tipoRecorrencia === 'Diária' ? i : 7 * i;
                        let date = moment(objDateInicio).add(addDays, 'days').set({
                            'hour': 0,
                            'minute': 0,
                            'second': 0,
                            'millisecond': 0
                        });
                        if ((date.toDate()).getDay() === 6) {
                            date = moment(date).add(2, 'days');
                            loop += 2;
                            i += 2;
                        }
                        let dataStr = date.locale('pt-br').format('L');
                        let diffDays = moment(date).diff(MyWidget.objDateFirst, "days", true);
                        _xml.find('[name=dateInicio]').text(dataStr);
                        _xml.find('[name=numRecorrencia]').text(numRecorrencia);
                        if (MyWidget.reload === null) {
                            if (diffDays >= 0 && diffDays < 7) {
                                MyWidget.reload = true;
                            } else {
                                MyWidget.reload = false;
                            }
                        }


                        WCMAPI.Create({
                            url: MyWidget.urlService,
                            contentType: "text/xml,charset=utf-8",
                            async: false,
                            dataType: "xml",
                            data: _xml[0],
                            success: function (data) {
                                let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                                let retorno = parseInt(xmlResp.getElementsByTagName("documentId")[0].innerHTML);
                                if (retorno === 0) {
                                    if ($('div#toaster').find('div.alert').length === 0) {
                                        MyWidget.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                                    }
                                    MyWidget.loadBodyModal.hide();
                                } else if (retorno > 0) {
                                    if ($('div#toaster').find('div.alert').length === 0) {
                                        MyWidget.setToast('Parabéns! ', 'Consulta agendada com sucesso', 'success', 4000);
                                    }
                                    MyWidget.loadBodyModal.hide();
                                    MyWidget.modalAgendamento.remove();
                                }
                            }
                        });
                        numRecorrencia++;
                    }
                } else {
                    let template = `{{#content}}
									<div class="alert alert-danger" role="alert">
									<strong><i class="icon-top fluigicon fluigicon-arrow-turn-right"></i>&nbsp;
									{{dataInicio}} {{horaInicio}} até {{datafim}} {{horaFim}}</strong> {{descricao}}
								</div>{{/content}}`;
                    let contentHTML = Mustache.render(template, log)
                    MyWidget.modalInfo = FLUIGC.modal({
                        title: 'Atenção!',
                        content: '<h3>Não possível realizar agendamentos. Profissional está com agenda bloqueada nos dias:</h3><br>' + contentHTML,
                        id: 'modal-info',
                        formModal: true,
                        size: 'large',
                    }, function (err, data) {
                        if (err === null) {
                            $('div#modal-info').on('hide.bs.modal', function () {
                                MyWidget.loadBodyModal.hide()
                            });
                        }
                    });
                }
            }
        }, 100);
    },
    //GERA TOKEN PARA FICHAS DE RECORRÊNCIA PARA IDENTIFICA-LAS DE FORMA RÁPIDA
    generateToken: function () {
        let d = new Date().getTime();
        let loop = true;
        let tokenSeries;
        while (loop) {
            if (window.performance && typeof window.performance.now === "function") {
                d += performance.now();
            }
            tokenSeries = 'ECP-xxyyyxx-xxxx-4xxx-yxxx-xxxx-yyyyyyy-xxxxxxxx-xxx-xxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });

            let token = DatasetFactory.createConstraint("tokenFicha", tokenSeries, tokenSeries, ConstraintType.MUST);
            let returnToken = DatasetFactory.getDataset("agendamento_consultas", ['tokenFicha'], [token], null);
            if (returnToken.values.length == 0) {
                loop = false;
            }
        }
        return tokenSeries;
    },
    //ABRE O MODAL DE VISUALIZAÇÃO DE INFORMAÇÕES DA CONSULTA
    openModalEdit: function (htmlElement, event) {
        let dataForm = $(htmlElement).find('#codFormulario').text();
        let dataConsulta = $(htmlElement).find('#dateInicio').text();
        let horaInicioConsulta = $(htmlElement).find('#hourInicio').text();
        let coDocument = DatasetFactory.createConstraint('documentid', $(htmlElement).find('#documentid').text(), $(htmlElement).find('#documentid').text(), ConstraintType.MUST);
        let ds_doc = DatasetFactory.getDataset('agendamento_consultas', ['consultaRealizada'], [coDocument], null);
        let dataAgendamento = moment((dataConsulta + ' ' + horaInicioConsulta), 'DD/MM/YYYY HH:mm').toDate();
        let active = moment(dataAgendamento).isAfter(new Date()) && ds_doc.values[0].consultaRealizada === 'false' ? true : false;
        let classDanger = active ? 'btn-danger' : 'fs-display-none';
        let classPrimary = active ? 'btn-primary' : 'fs-display-none';
        let medico = $('.selectpicker').find('option:selected').val();
        let form = MyWidget.requestAJAX(dataForm, 'html');
        MyWidget.cardInfos = $(htmlElement);
        $('body').addClass('scroll-hidden');
        MyWidget.modalView = FLUIGC.modal({
            title: 'Visualização da consulta do profissional' + medico,
            content: $(form[0]).html(),
            id: 'modal-view',
            formModal: true,
            size: 'full',
            actions: [{
                'buttonType': 'button',
                'classType': 'btn-primary fs-display-none salve'
            }, {
                'buttonType': 'button',
                'classType': classPrimary + ' edit'
            }, {
                'buttonType': 'button',
                'classType': classDanger + ' cancel'
            }, {
                'autoClose': true,
                'buttonType': 'button',
                'classType': 'btn-default fechar'
            }]
        }, function (err, data) {
            if (err === null) {
                $('#modal-view').on('hide.bs.modal', function (event) {
                    $('body').removeClass('scroll-hidden');
                });
                $('div#modal-view button.btn-primary.edit').html('<i class="fluigicon fluigicon-pencil"></i>&nbsp; Editar Consulta');
                $('div#modal-view button.btn-danger.cancel').html('<i class="fluigicon fluigicon-calendar-remove"></i>&nbsp; Cancelar Consulta');
                $('div#modal-view button.btn-default.fechar').html('<i class="fluigicon fluigicon-remove"></i>&nbsp; Fechar');
                $('div#modal-view button.btn-primary.salve').html('<i class="fluigicon fluigicon-calendar-verified"></i>&nbsp; Salvar Alterações');
                $('div.modal-header').find('button.close').remove();
                $('div.modal-footer').find('button[type=submit]').attr({
                    'type': 'button',
                    'data-salve': ''
                });
                $('div.modal-footer').find('button.edit').attr({
                    'type': 'button',
                    'data-edit': ''
                });
                $('div.modal-footer').find('button.cancel').attr({
                    'type': 'button',
                    'data-cancel': ''
                });
                if (!active) {
                    $('div#modal-view button.edit').remove();
                    $('div#modal-view button.cancel').remove();
                    $('div#modal-view button.salve').remove();
                }
                $.each($(htmlElement).find('span, div'), function (index, val) {
                    var value = $(this).text();
                    if (this.id === 'tempoConsulta') {
                        $('div#modal-view').find('[name=' + this.id + ']').prop('disabled', true).val(value);
                    } else if (this.id === 'observacoes') {
                        $('div#modal-view').find('[name=' + this.id + ']').text(value).prop('disabled', true);
                    } else if (this.id === 'tipoRecorrencia') {
                        $('div#modal-view').find('[name=' + this.id + ']').val(value).prop('disabled', true);
                        if ($(this).text() !== '') {
                            FLUIGC.switcher.setTrue('input[name=haRecorrencia]');
                            $('div.recorrencia-data').show('slow');
                        }
                    } else if (this.id !== 'haRecorrencia') {
                        $('div#modal-view').find('[name=' + this.id + ']').prop('disabled', true).removeClass('fs-no-bg').val(value);
                    }
                });
                FLUIGC.switcher.disable('input[name=haRecorrencia]');
                $('div#modal-view').on('hide.bs.modal', function (event) {
                    $('body').removeClass('scroll-hidden');
                    MyWidget.cardInfos = null;
                });
            }
        });
    },
    //LIBERAR OS CAMPOS PARA EDIÇÃO DAS INFORMAÇÕES
    editarInformacoes: function (htmlElement, event) {
        $(htmlElement).closest('div.modal-footer').find('button.edit, button.cancel, button.salve').toggleClass('fs-display-none')
        $.each($('div#modal-view div.modal-body').find('input:not([data-edit]), select:not([data-edit]), textarea'), function (index, val) {
            if (this.name === 'dateInicio' || this.name === 'hourInicio' || this.name === 'hourFinal') {
                $(this).prop('disabled', false).addClass('fs-no-bg');
            } else {
                $(this).prop('disabled', false);
            }
        });
    },
    //SALVE EDIT INFOS EDITADOS
    salvarEdicao: function (htmlElement, event) {
        MyWidget.loadModalEdit = FLUIGC.loading('div#modal-view');
        MyWidget.loadModalEdit.show();
        setTimeout(a => {
            var parser = new DOMParser();
            let horaInicio = $('div#modal-view').find('input#hourInicio').val();
            let horaFim = $('div#modal-view').find('input#hourFinal').val();
            let dataConsulta = $('div#modal-view').find('input#dateInicio').val();
            if (MyWidget.validarForm('data-required')) {
                MyWidget.setToast('Opss! ', 'Os campos sinalizados com * são de preenchimento obrigatório.', 'danger', 4000);
                MyWidget.loadModalEdit.hide();
            } else if ((parseInt(horaInicio.replace(':', '')) < 800 || parseInt(horaInicio.replace(':', '')) > 2230) && horaInicio !== '') {
                MyWidget.setToast('Opss! ', 'O horário de ínicio da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e menor que o horário de término.', 'danger', 4000);
                MyWidget.loadModalEdit.hide();
                return false;
            } else if ((parseInt(horaFim.replace(':', '')) < 800 || parseInt(horaFim.replace(':', '')) > 2230) && horaFim !== '') {
                MyWidget.setToast('Opss! ', 'O horário de término da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e maior que o horário de ínicio.', 'danger', 4000);
                MyWidget.loadModalEdit.hide();
                return false;
            } else {
                if (moment(dataConsulta + ' ' + horaInicio, 'DD/MM/YYYY HH:mm').isAfter(new Date())) {
                    let _xml = MyWidget.requestAJAX('ECMCardService_Update', 'xml');
                    let create = true;
                    let filtersRestricao = [];
                    let log = { content: [] };
                    //VERIFICA SE HÁ RESTRIÇÕES NO RANGE DE DATAS INDICADA;
                    filtersRestricao[0] = DatasetFactory.createConstraint('bloqueioCancelado', 'false', 'false', ConstraintType.MUST);
                    filtersRestricao[1] = DatasetFactory.createConstraint('matMedico', MyWidget.matProfissional, MyWidget.matProfissional, ConstraintType.MUST);
                    filtersRestricao[filtersRestricao.length] = DatasetFactory.createConstraint('arrayDates', '%' + dataConsulta + '%', '%' + dataConsulta + '%', ConstraintType.SHOULD);
                    filtersRestricao[filtersRestricao.length - 1]._likeSearch = true;
                    let ds_restricoes = DatasetFactory.getDataset('cadastro_restricoes', null, filtersRestricao, null);

                    if (ds_restricoes !== undefined && ds_restricoes !== null && ds_restricoes.values.length > 0) {
                        let retorno = ds_restricoes.values;
                        for (let y = 0; y < retorno.length; y++) {
                            if ((retorno[y].tdClass).indexOf(horaInicio.replace(/\:/gi, '')) > -1 || (retorno[y].tdClass).indexOf(horaFim.replace(/\:/gi, '')) > -1) {
                                create = false;
                                log.content.push({ dataInicio: retorno[y].dataInicial, horaInicio: retorno[y].horaInicial, datafim: retorno[y].dataFinal, horaFim: retorno[y].horaFinal, descricao: retorno[y].motivo });
                            }
                        }
                    }
                    if (create) {
                        $.each($('div#modal-view div.modal-body').find('input, select, textarea'), function (index, val) {
                            if (this.name !== 'logAlteracao') {
                                _xml.find('[name=' + this.name + ']').text(this.value);
                            }
                        });
                        let tdsClass = MyWidget.calculaClasses(dataConsulta, horaInicio, horaFim);
                        _xml.find('[name=haRecorrencia]').text($('div#modal-view').find('input#haRecorrencia').is(':checked'));
                        _xml.find('[name=consultaCancelada]').text('false');
                        _xml.find('[name=colorAgenda]').text($(MyWidget.cardInfos).find('#colorAgenda').text());
                        _xml.find('[name=consultaRealizada]').text('false');
                        _xml.find('[name=matMedico]').text($(MyWidget.cardInfos).find('#matMedico').text());
                        _xml.find('[name=atletaFaltou]').text($(MyWidget.cardInfos).find('#atletaFaltou').text());
                        _xml.find('[name=typeConsulta]').text($(MyWidget.cardInfos).find('#typeConsulta').text());
                        _xml.find('[name=tdClass]').text(tdsClass.toString());
                        _xml.find('[name=codFormulario]').text($(MyWidget.cardInfos).find('#codFormulario').text());

                        if (_xml.find('[name=descricao]').text() === '') {
                            if ($(MyWidget.cardInfos).find('#codFormulario').text() === 'formAtendimentoEquipe') {
                                _xml.find('[name=descricao]').text($(MyWidget.cardInfos).find('#modalidadeAtleta').text() + ' - ' + $(MyWidget.cardInfos).find('#categoriaAtleta').text());
                            } else {
                                _xml.find('[name=descricao]').text($('div#modal-view div.modal-body').find('input[name=nameAtleta]').val());
                            }
                        }

                        _xml.find('[name=logAlteracao]').text($(MyWidget.cardInfos).find('#logAlteracao').text() + '\n' + moment(new Date()).locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Consulta editada');
                        _xml.find("companyId").text(MyWidget.tenantCode);
                        _xml.find("username").text(MyWidget.login);
                        _xml.find("password").text(MyWidget.password);
                        _xml.find("cardId").text(parseInt($(MyWidget.cardInfos).find('#documentid').text()));
                        //Enviando a requisição
                        WCMAPI.Create({
                            url: MyWidget.urlService,
                            contentType: "text/xml,charset=utf-8",
                            dataType: "xml",
                            data: _xml[0],
                            success: function (data) {
                                let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                                let retorno = xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML;
                                if (retorno === 'ok') {
                                    if ($('div#toaster').find('div.alert').length === 0) {
                                        MyWidget.setToast('Parabéns!', 'Consulta editada com sucesso.', 'success', 4000);
                                    }
                                    MyWidget.getConsutas();
                                    MyWidget.loadModalEdit.hide();
                                    MyWidget.modalView.remove();
                                } else {
                                    MyWidget.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                                    MyWidget.loadBodyModal.hide();
                                }
                            }
                        });
                    } else {
                        let template = `{{#content}}
										<div class="alert alert-danger" role="alert">
										<strong><i class="icon-top fluigicon fluigicon-arrow-turn-right"></i>&nbsp;
										{{dataInicio}} {{horaInicio}} até {{datafim}} {{horaFim}}</strong> {{descricao}}
									</div>{{/content}}`;
                        let contentHTML = Mustache.render(template, log)
                        MyWidget.modalInfo = FLUIGC.modal({
                            title: 'Atenção!',
                            content: '<h3>Não possível gravar edição. Profissional está com agenda bloqueada nos dias:</h3><br>' + contentHTML,
                            id: 'modal-info',
                            formModal: true,
                            size: 'large',
                        }, function (err, data) {
                            if (err === null) {
                                $('div#modal-info').on('hide.bs.modal', function () {
                                    MyWidget.loadModalEdit.hide()
                                });
                            }
                        });
                    }
                } else {
                    MyWidget.setToast('Atenção! ', 'A consulta não pode ser editada para uma data e hora inferior a atual.', 'danger', 4000);
                    MyWidget.loadModalEdit.hide();
                }
            }
        }, 100);
    },
    //ABRE MODAL DE CANCELAMENTO
    openModalCancel: function () {
        let form = MyWidget.requestAJAX('formJustificativa', 'html');
        if ($(MyWidget.cardInfos[0]).find('span#haRecorrencia').text() === 'false') {
            form.find('div.cancel-recorrencia').addClass('fs-display-none');
        }
        MyWidget.modalCancelamento = FLUIGC.modal({
            title: 'Cancelamento de consulta',
            content: $(form[0]).html(),
            id: 'modal-cancelamento',
            formModal: true,
            size: 'large ',
            actions: [{
                'buttonType': 'button',
                'classType': 'btn-primary btn-yes'
            }, {
                'buttonType': 'button',
                'classType': 'btn-default cancel-close',
                'autoClose': true
            }]
        }, function (err, data) {
            if (err === null) {
                $('div#modal-cancelamento button.btn-primary.btn-yes').html('<i class="fluigicon fluigicon-checked"></i>&nbsp; Sim');
                $('div#modal-cancelamento button.btn-default.cancel-close').html('<i class="fluigicon fluigicon-remove"></i>&nbsp; Não');
                $('div.modal-header').find('button.close').remove();
                $('div.modal-footer').find('button[type=submit]').attr({
                    'type': 'button',
                    'data-confirmCancel': ''
                });
            }
        });
    },
    //REGISTRAR CANCELAMENTO DO AGENDAMENTO
    registrarCancelamento: function (htmlElement, event) {
        MyWidget.loadModalCancel = FLUIGC.loading('div#modal-cancelamento');
        MyWidget.loadModalCancel.show();
        setTimeout(a => {
            if (MyWidget.validarForm('data-required-cancel')) {
                MyWidget.setToast('Opss! ', 'Os campos sinalizados com * são de preenchimento obrigatório.', 'danger', 4000);
                MyWidget.loadModalCancel.hide();
            } else {
                let _xml;
                var parser = new DOMParser();
                let cancelRecorrencia = $('div#modal-cancelamento').find('select#cancelRecorrencia').val();
                if (cancelRecorrencia === 'Não' || cancelRecorrencia === null) {
                    _xml = MyWidget.requestAJAX('ECMCardService_Update', 'xml');
                    _xml.find("companyId").text(MyWidget.tenantCode);
                    _xml.find("username").text(MyWidget.login);
                    _xml.find("password").text(MyWidget.password);
                    $.each($(MyWidget.cardInfos).find('span, div'), function (index, val) {
                        if (this.id !== 'logAlteracao' && this.id !== 'consultaCancelada') {
                            _xml.find('[name=' + this.id + ']').text(this.innerHTML);
                        }
                    });
                    _xml.find('[name=logAlteracao]').text($(MyWidget.cardInfos).find('#logAlteracao').text() + '\n' + moment(new Date()).locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Consulta cancelada - ' + $('textarea[name=justificarCancelamento]').val());
                    _xml.find("cardId").text(parseInt($(MyWidget.cardInfos).find('#documentid').text()));
                    _xml.find('[name=consultaCancelada]').text('true');
                    WCMAPI.Create({
                        url: MyWidget.urlService,
                        contentType: "text/xml,charset=utf-8",
                        dataType: "xml",
                        async: false,
                        data: _xml[0],
                        success: function (data) {
                            let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                            let retorno = xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML;
                            if (retorno === 'ok') {
                                if ($('div#toaster').find('div.alert').length === 0) {
                                    MyWidget.setToast('Ok!', 'Consulta cancelada', 'success', 4000);
                                }
                                MyWidget.removeObjects();
                            } else {
                                if ($('div#toaster').find('div.alert').length === 0) {
                                    MyWidget.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                                }
                                MyWidget.loadModalCancel.hide();
                            }

                        }
                    });
                } else {
                    let cToken = DatasetFactory.createConstraint('tokenFicha', $(MyWidget.cardInfos).find('#tokenFicha').text(), $(MyWidget.cardInfos).find('#tokenFicha').text(), ConstraintType.MUST);
                    let cConsultaRealizada = DatasetFactory.createConstraint('consultaRealizada', 'false', 'false', ConstraintType.MUST);
                    let dsCancel = DatasetFactory.getDataset('agendamento_consultas', null, [cToken, cConsultaRealizada], null);
                    if (dsCancel.columns[0] === 'Mensagem') {
                        if ($('div#toaster').find('div.alert').length === 0) {
                            MyWidget.setToast('Atenção! ', ds_consultas.values[0].Mensagem, 'danger', 4000);
                        }
                    } else {
                        for (let i = 0; i < dsCancel.values.length; i++) {
                            let dataConsulta = dsCancel.values[i].dateInicio;
                            let hora = dsCancel.values[i].hourInicio;;
                            if (moment(dataConsulta + ' ' + hora, 'DD/MM/YYYY HH:mm').isAfter(new Date())) {
                                _xml = MyWidget.requestAJAX('ECMCardService_Update', 'xml');
                                _xml.find("companyId").text(MyWidget.tenantCode);
                                _xml.find("username").text(MyWidget.login);
                                _xml.find("password").text(MyWidget.password);
                                $.each(dsCancel.values[i], function (index, val) {
                                    if (index !== 'logAlteracao' && index !== 'consultaCancelada' && index.indexOf('#') < 0) {
                                        _xml.find('[name=' + index + ']').text(val);
                                    }
                                });
                                _xml.find("cardId").text(parseInt(dsCancel.values[i].documentid));
                                _xml.find('[name=consultaCancelada]').text('true');
                                _xml.find('[name=logAlteracao]').text(dsCancel.values[i].logAlteracao + '\n' + moment(new Date()).locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Consulta cancelada - ' + $('textarea[name=justificarCancelamento]').val());
                                WCMAPI.Create({
                                    url: MyWidget.urlService,
                                    contentType: "text/xml,charset=utf-8",
                                    dataType: "xml",
                                    async: false,
                                    data: _xml[0],
                                    success: function (data) {
                                        let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                                        let retorno = xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML;
                                        if (retorno === 'ok') {
                                            if ($('div#toaster').find('div.alert').length === 0) {
                                                MyWidget.setToast('Ok!', 'Consultas canceladas', 'success', 4000);
                                            }
                                            MyWidget.removeObjects();
                                        } else {
                                            if ($('div#toaster').find('div.alert').length === 0) {
                                                MyWidget.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                                            }
                                            MyWidget.loadModalCancel.hide();
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }, 100);
    },
    removeObjects: function () {
        MyWidget.loadModalCancel.hide();
        MyWidget.modalCancelamento.remove()
        MyWidget.modalView.remove()
        MyWidget.getConsutas();
    },
    openRightBar: function (htmlElement, event) {
        let contentBody = MyWidget.requestAJAX('contentBarRight', 'html');
        FLUIGC.modal({
            title: '',
            content: '<div id="dv-clone"></div><div class="row"><div class="col-xs-12 col-sm-12 col-md-12 col-lg-12 text-center"><div class="detalhes"></div></div></div></div>',
            id: 'modal-search',
            formModal: false,
            size: 'full',
        }, function (err, data) {
            if (err === null) {
                $('div#modal-search div.modal-header').append($(contentBody[0]).html());
            }
        });
    },
    searchConsultasBar: function () {
        let tClass;
        let toastBody = MyWidget.requestAJAX('toastBarRight', 'html');
        let objClasses = {
            formAvaliacao: 'dd-avaliacao',
            formAvaliacaoPreContrato: 'dd-precontrato',
            formOutros: 'dd-outros',
            formAtendimento: 'dd-attindividual',
            formAtendimentoEquipe: 'dd-attequipe',
        };
        $('div#modal-search div.modal-body').find('div.detalhes').css('display', 'none');
        $('div#modal-search div.modal-body').find('div.detalhes').children().remove();
        let matadata = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
        let dataConsulta = DatasetFactory.createConstraint("dateInicio", $('input[name=dataSearch]').val(), $('input[name=dataSearch]').val(), ConstraintType.MUST);
        let active = DatasetFactory.createConstraint("consultaCancelada", 'false', 'false', ConstraintType.MUST);
        let medico = DatasetFactory.createConstraint("matMedico", MyWidget.matProfissional, MyWidget.matProfissional, ConstraintType.MUST);
        var consultas = DatasetFactory.getDataset("agendamento_consultas", null, [matadata, dataConsulta, active, medico], ['tdClass']);
        if (consultas.values.length > 0) {
            for (var i = 0; i < consultas.values.length; i++) {
                var card = toastBody.clone();
                if (i === 0 || tClass !== parseInt((consultas.values[i].hourInicio).replace(':', ''))) {
                    tClass = parseInt((consultas.values[i].hourInicio).replace(':', ''));
                    $('div#modal-search div.modal-body').find('div.detalhes').append('<br><legend class="text-left">Início às ' + consultas.values[i].hourInicio + ' horas</legend>');
                }
                card.find('div.dd-main').text(consultas.values[i].descricao)
                card.find('ul.dd-header').addClass(objClasses[consultas.values[i].codFormulario])
                $('div#modal-search div.modal-body').find('div.detalhes').append(card[0]);
            }
        } else {
            $('div#modal-search div.modal-body').find('div.detalhes').append('<br><br><br><h4>Opss! Sem agendamentos no dia pesquisado.</h4>');
        }
        $('div#modal-search div.modal-body').find('div.detalhes').show('slow');
    },
    getIds: function getIds() {
        /*  credenciais.login
         credenciais.matricula
         credenciais.password
         */
        var ds = DatasetFactory.getDataset("dsAutenticacao", null, null, null);
        ds = ds.values[0]["STR_OBJ"];
        var obj = JSON.parse(ds);
        return obj[0];

    }
    /* openRightBar: function (htmlElement, event) {
        let contentBody = MyWidget.requestAJAX('contentBarRight', 'html');
        $('body').css('overflow-y', 'hidden').append('<div class="fluig-style-guide modal-backdrop rightbar-backdrop  in" style="height: 100vmax; top: 0px;"></div>');
        MyWidget.rightbar = FLUIGC.rightbar({
            appendTo: 'body',
            content: contentBody.html(),
            width: '50%',
            fixed: true
        });
        $('#divRightBar').css('z-index', '1089');
    },
    searchConsultasBar: function () {
        let tClass;
        let toastBody = MyWidget.requestAJAX('toastBarRight', 'html');
        let objClasses = {
            formAvaliacao: 'dd-avaliacao',
            formAvaliacaoPreContrato: 'dd-precontrato',
            formOutros: 'dd-outros',
            formAtendimento: 'dd-attindividual',
            formAtendimentoEquipe: 'dd-attequipe',
        };
        $('#divRightBar').find('div.detalhes').css('display', 'none');
        $('#divRightBar').find('div.detalhes').children().remove();
        let matadata = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
        let dataConsulta = DatasetFactory.createConstraint("dateInicio", $('input[name=dataSearch]').val(), $('input[name=dataSearch]').val(), ConstraintType.MUST);
        let active = DatasetFactory.createConstraint("consultaCancelada", 'false', 'false', ConstraintType.MUST);
        let medico = DatasetFactory.createConstraint("matMedico", MyWidget.matProfissional, MyWidget.matProfissional, ConstraintType.MUST);
        var consultas = DatasetFactory.getDataset("agendamento_consultas", null, [matadata, dataConsulta, active, medico], ['tdClass']);
        if (consultas.values.length > 0) {
            for (var i = 0; i < consultas.values.length; i++) {
                var card = toastBody.clone();
                if (i === 0 || tClass !== parseInt((consultas.values[i].hourInicio).replace(':', ''))) {
                    tClass = parseInt((consultas.values[i].hourInicio).replace(':', ''));
                    $('#divRightBar').find('div.detalhes').append('<br><legend class="text-left">Início às ' + consultas.values[i].hourInicio + ' horas</legend>');
                }
                card.find('div.dd-main').text(consultas.values[i].descricao)
                card.find('ul.dd-header').addClass(objClasses[consultas.values[i].codFormulario])
                $('#divRightBar').find('div.detalhes').append(card[0]);
            }
        } else {
            $('#divRightBar').find('div.detalhes').append('<br><br><br><h4>Opss! Sem agendamentos no dia pesquisado.</h4>');
        }
        $('#divRightBar').find('div.detalhes').show('slow');
    } */
});