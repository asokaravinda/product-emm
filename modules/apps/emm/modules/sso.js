var sso = {};
var ssoMod = require("sso");
 (function () {
 	var carbon = require("carbon");
 	var process = require("process");
 	var getSSOSessions = function(){
 		var sso_sessions = application.get('sso_sessions');

	    if (!sso_sessions) {
	        application.put('sso_sessions', {});
	        sso_sessions = application.get('sso_sessions');
	    }
	    return sso_sessions;
 	}
 	sso.configure = function(issuer, appName, keyStoreParams, address, transport, ssoService, responseSign){
 		sso.issuer = issuer;
 		sso.appName = appName;
 		sso.relayState = "/"+appName;
 		sso.transport = (transport? transport : "https");
 		sso.ssoService = (ssoService? ssoService : "/samlsso");
 		sso.responseSign = (responseSign? responseSign : true);
 		sso.log = new Log("SSO Module");
 		sso.address = carbon.server.address(sso.transport);
 		sso.keyStoreProps = {
                KEY_STORE_NAME: process.getProperty('carbon.home') + keyStoreParams.keyStoreName,
                KEY_STORE_PASSWORD: keyStoreParams.keyStorePassword,
                IDP_ALIAS: keyStoreParams.identityAlias
        };
 	}
 	sso.login = function(){
 		sso.sessionId = session.getId();
 		var referer = request.getHeader("referer");
 		sso.relayState = (referer ? referer : sso.relayState);
 		sso.relayState = sso.relayState + request.getQueryString(); // append query string
 		sso.encodedSAMLAuthRequest = ssoMod.client.getEncodedSAMLAuthRequest(sso.issuer);
 		var postUrl = sso.address + sso.ssoService;
 		print("<div><p>You are now being redirected to SSO Provider. If the redirection fails, please click on the button below.</p> <form method='post' action='"+postUrl+"'><p><input type='hidden' name='SAMLRequest' value='"+sso.encodedSAMLAuthRequest+"'/><input type='hidden' name='RelayState' value='"+sso.relayState+"'/><input type='hidden' name='SSOAuthSessionID' value='"+sso.sessionId+"'/><button type='submit'>Redirect manually</button></p></form></div><script type = 'text/javascript' >document.forms[0].submit();</script>");
 	}
 	sso.logout = function(user){
 		var sso_sessions = getSSOSessions();
 		sso.sessionId = session.getId();
 		sso.sessionIndex = sso_sessions[sso.sessionId];

 		var referer = request.getHeader("referer");
 		sso.relayState = (referer ? referer : sso.relayState);
 		sso.relayState = sso.relayState + request.getQueryString(); // append query string
 		sso.encodedSAMLLogoutRequest = ssoMod.client.getEncodedSAMLLogoutRequest(user, sso.sessionIndex , sso.issuer);
 		sso.log.debug("Logout request recieved from session id ###: " + sso.sessionId );
 		
 		var postUrl = sso.address + sso.ssoService;
 		sso.log.info(sso.sessionId);
 		print("<div><p>You are now redirected to Stratos Identity. If theredirection fails, please click the post button.</p> <form id='logoutForm' method='post' action='"+postUrl+"'> <p> <input type='hidden' name='SAMLRequest' value='"+sso.encodedSAMLLogoutRequest+"'/> <input type='hidden' name='RelayState' value='"+sso.relayState+"'/> <input type='hidden' name='SSOAuthSessionID' value='"+sso.sessionId+"'/> <button type='submit'>POST</button> </p> </form> </div> <script type = 'text/javascript' > document.forms[0].submit(); </script>");
 	}
 	sso.acs = function(loginCallback, logoutCallback){
	    var sso_sessions = getSSOSessions();
	    sso.sessionId = session.getId();
	    var samlResponse = request.getParameter('SAMLResponse');
	    var samlRequest = request.getParameter('SAMLRequest');
	    var relayState = request.getParameter('RelayState');
	    var samlRespObj;
	    
	    if (samlResponse != null) {
	        samlRespObj = ssoMod.client.getSamlObject(samlResponse);
	        if(ssoMod.client.isLogoutResponse(samlRespObj)){
	        	logoutCallback();
		        sso.log.debug('Session Id Invalidated :::' + sso.sessionId);
		        // Invalidating the session after the callback
		        session.invalidate();
	        }else{
	        	sso.log.debug("Login request");
	            // validating the signature
	            if (sso.responseSign) {
	                if (ssoMod.client.validateSignature(samlRespObj, sso.keyStoreProps)) {
	                    var sessionObj = ssoMod.client.decodeSAMLLoginResponse(samlRespObj, samlResponse, sso.sessionId);
	                    sso.log.debug("Saml object session ID :"+sessionObj.sessionId);
	                    if (sessionObj.sessionIndex != null || sessionObj.sessionIndex != 'undefined') {
	                    	sso_sessions[sso_sessions[sessionObj.sessionIndex] = sessionObj.sessionId] = sessionObj.sessionIndex;
	                        sso.log.debug("Login successful");
	                        sso.log.debug('user is set :::' + sessionObj.loggedInUser);
	                        loginCallback(sessionObj.loggedInUser);
	                    }else{
	                    	sso.log.error("Session index invalid");
	                    }
	                }else{
	                	sso.log.error("Response Signing failed");
	                }
	            }else{
	            	sso.log.debug("Response Signing is disabled");
	            }
	        }
	    }
	    /* 
			Executed for single logout requests
	    */
	    if(samlRequest!= null){
	    	var index = ssoMod.client.decodeSAMLLogoutRequest(ssoMod.client.getSamlObject(samlRequest));
	        sso.log.debug('BACKEND LOGOUT RECIEVED FROM STORE THE INDEX IS ######' + index);
	        var jSessionId = getSSOSessions()[index];
	        delete getSSOSessions()[index];
	        sso.log.debug('Session Id Invalidated :::' + jSessionId);
	        // Invalidating the session after the callback
	        session.invalidate();
	    }
 	}
 })();