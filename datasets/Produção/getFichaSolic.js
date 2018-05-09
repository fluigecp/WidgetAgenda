function createDataset(fields, constraints, sortFields) {
	try {
		log.warn("#### INICIANDO CONSULTA de getFichaSolic");

		var nSolic;
		 for(var c in constraints){
		 	log.warn("%%% +++++++  getFichaSolic constraints[c].fieldName "+constraints[c].fieldName);
	    	if(constraints[c].fieldName == 'solicitacao'){
	    		nSolic = [parseInt(constraints[c].initialValue)];
	    		log.warn("%%% +++++++  getFichaSolic nSolic "+nSolic);
	    		break;
	    	}

	    }

	    log.warn("#### getFichaSolic - sai do constraints com o nSolic "+nSolic);

		if(nSolic == null || nSolic == undefined){
			log.warn("%%% +++++++ NSOLIC null ou undefined");
			var dataset = DatasetBuilder.newDataset();
			dataset.addColumn("solicitacao");
			dataset.addColumn("documentid");
			//dataset.addColumn("mapa");
			dataset.addRow(new Array("NSDSFDSF", "M/A"));
			
			return dataset;
		}	
	    
	
 		var servico = ServiceManager.getService("ECMWorkflowEngineService").getBean();
		var locator = servico.instantiate("com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService");
		var WorkflowEngineService = locator.getWorkflowEngineServicePort();
	    var login = "servico.fluig@ecp.org.br";
	    var senha = "Fcea920f7412b5d@";
	    var empresa = 1;
	    var requisitador = "0000";
	    var retorno = WorkflowEngineService.getInstanceCardData(login, senha, empresa, requisitador, nSolic);
	    log.warn("%%% +++++++ INICIANDO CONSULTA de getFichaSolic retorno "+retorno);
	    

	    var dataset = DatasetBuilder.newDataset();
		dataset.addColumn("solicitacao");
		dataset.addColumn("documentid");
		dataset.addColumn("mapa")
		log.warn("%%% +++++++ INSTANCIEI O DATASET");
	

	
		var docId = "";
		var arrayValores = [];

		for(var j=0 ; j < retorno.getItem().size() ; j++){
			var coluna  = retorno.getItem().get(j).getItem().get(0);
			var valor  = retorno.getItem().get(j).getItem().get(1);
			if(coluna == "documentid"){
				log.warn("Coluna é igual a documentid e o valor eh "+valor);
				docId = valor;
				
			}
		
		

			arrayValores.push( coluna+":"+valor ) ;
			
		}

		log.warn("%%% +++++++ terminei o for nSolic "+nSolic);
		log.warn("%%% +++++++ terminei o for docId "+docId);
		var arrayRetorno = [];
		arrayRetorno.push(nSolic+"");
		arrayRetorno.push(docId);
		arrayRetorno.push(arrayValores.toString());
		log.warn("%%% +++++++ terminei o for arrayRetorno.toString() "+arrayRetorno.toString());
		dataset.addRow(arrayRetorno);
	  
	    log.warn("%%% +++++++ vou retornar o dataset ");

	    return dataset;


	} catch (erro) {
		log.error("%%% +++++++ ERRO No getFichaSolic: "+erro);
		return null
	}
    

}