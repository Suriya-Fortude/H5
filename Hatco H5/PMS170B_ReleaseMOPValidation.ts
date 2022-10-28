/**
* H5 Script SDK sample.
*/

/**
 * Add script to POS015/E
 * Subscribes to the Requesting event 
 * On event, it checks the name of the project leader. If invalid, it cancels the request and shows an error message
 */
class PMS170B_ReleaseMOPValidation {
    private controller: IInstanceController;
    private log: IScriptLog;
    private unsubscribeRequesting;
    private unsubscribeRequested;
    private miService;
    private configCode = "";

    //Set Button
    private buttonElement: any;
    private isAPIOk: boolean;


    constructor(scriptArgs: IScriptArgs) {
        this.controller = scriptArgs.controller;
        this.log = scriptArgs.log;
        
        //if (ScriptUtil.version >= 2.0) {
           // this.miService = MIService;
        //} else {
            this.miService = MIService.Current
        //}

        this.isAPIOk = false;
    }

    /**
     * Script initialization function.
     */
    public static Init(args: IScriptArgs): void {
        new PMS170B_ReleaseMOPValidation(args).run();
    }

    private async run() {
        this.unsubscribeRequesting = this.controller.Requesting.On((e) => {
            this.onRequesting(e);
        });
        this.unsubscribeRequested = this.controller.Requested.On((e) => {
            this.onRequested(e);
        });
    }

    private async onRequesting(args: CancelRequestEventArgs) {
        this.log.Info("onRequesting");
        if (!this.isAPIOk) {
            if (args.commandType == "LSTOPT" && args.commandValue == "11") {
                args.cancel = true;
                let PRNO = ListControl.ListView.GetValueByColumnName("PRNO")[0];
                await this.getConfigCode(args, PRNO);
                this.log.Info("API Completed ..." + this.configCode);
            }
        }
    }

    private onRequested(args: CancelRequestEventArgs): void {
        this.log.Info("onRequested");

        this.unsubscribeRequested();
        this.unsubscribeRequesting();
    }

    private async getConfigCode(args: CancelRequestEventArgs, itemNumber: String) {
        console.log("ITNO: " + itemNumber)
        const myRequest = new MIRequest();
        myRequest.program = "MMS200MI";
        myRequest.transaction = "Get";
        myRequest.record = { ITNO: itemNumber };
        myRequest.outputFields = ["CHCD"];
        return new Promise((resolve, reject) => {
            MIService.Current.executeRequest(myRequest).then(
                (response: IMIResponse) => {
                    //Read results here
                    for (let item of response.items) {
                        this.log.Info(`2: Config Code: ${item.CHCD}`);
                        this.configCode = item.CHCD;
                        if (this.configCode == "1") {
                            this.displayMessage("Forecasted Configured Proposals can not be released.");
                        } else {
                            alert("Proceed");
                            args.cancel = false;
                            this.isAPIOk = true;
                            resolve("True") 
                            //args.controller.ListOption("11");
                        }
                    }
                }).catch((response: IMIResponse) => {
                    //Handle errors here
                    this.log.Error(response.errorMessage);
                    this.configCode = "";
                    reject("False")
                });
        })
      
    }

    private displayMessage(message: string) {
        const opts = {
            dialogType: "Information",
            header: "Validation",
            message: message,
            id: "msgDetails",
            withCancelButton: true,
            isCancelDefault: false
        };

        ConfirmDialog.ShowMessageDialog(opts);
    }
}