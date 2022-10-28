/**
** Dispaly Pre text notes of the customer order in MWS410. 
**
** Developed By: SuriyaN@fortude.co
** Date: 2022-04-28
**
**/

class MWS410_Notes { /** * Script initialization function. */
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private orderTypeArray;
    private contentElement;
    private detachRequesting: Function;
    private detachRequested: Function;
    
    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
        this.contentElement = scriptArgs.controller.GetContentElement();
    };
    public static Init(args: IScriptArgs): void {
        new MWS410_Notes(args).run();
    };
    public run(): void {
        this.attachEvents(this.controller);
        this.addTextArea();
        this.addTextData();
    };
    private detachEvents(): void {
        this.detachRequesting();
        this.detachRequested();
    }
    private attachEvents(controller: IInstanceController): void {
        this.detachRequesting = controller.Requesting.On((e) => {
            this.onRequesting(e);
        });
        this.detachRequested = controller.Requested.On((e) => {
            this.onRequested(e);
        });
    }
    private addTextArea(): void
    {
        console.log("Working")
        const Label = new LabelElement();
        Label.Name = "Pre-Text Notes";
        Label.Value = "Pre-Text Notes";
        Label.Position = new PositionElement();
        Label.Position.Top = 1;
        Label.Position.Left = 50;
        Label.Position.Width = 50;
        const controller = this.controller;
        const label = this.contentElement.AddElement(Label);
        try {
            var checkIfExists = document.getElementById("OrderText");
            if (!document.body.contains(checkIfExists)) {
                var textbox = document.createElement('textarea');
                textbox.id = "OrderText";
                document.getElementsByClassName("field-short h5-row h5-filter-options-row")[0].appendChild(textbox);
                document.getElementById("OrderText").setAttribute("readOnly", "true");
                document.getElementById("OrderText").style.width = "850px";
                document.getElementById("OrderText").style.height = "75px";
                document.getElementById("OrderText").style.position = 'absolute';
                document.getElementById("OrderText").style.left = '600px';
                document.getElementById("OrderText").style.top = '40px';
                document.getElementById("OrderText").style.overflow = 'scroll';
                document.getElementById("OrderText").style.backgroundColor = '#ffffff';
               
            }
           
        } catch (Exception)
        {
            console.log(Exception.message);
            if (Exception.message.includes("appendChild")) {
                var textboxClassic = new TextAreaElement();
                textboxClassic.IsBrowsable = false;
                textboxClassic.IsReadDisabled = false;
                textboxClassic.Name = "OrderText";
                textboxClassic.Value = "";
                textboxClassic.Position = new PositionElement();
                textboxClassic.Position.Top = 2;
                textboxClassic.Position.Left = 50;
                this.contentElement.AddElement(textboxClassic);
                document.getElementById("OrderText").style.width = "850px";
                document.getElementById("OrderText").style.height = "75px";
                document.getElementById("OrderText").setAttribute("readOnly", "true");
            }
        }
        $('#OrderText').css({ overflow: 'scroll' });
    }


    private addTextData(): void {
        var textNotes = "";
        var RIDN = ScriptUtil.GetFieldValue("WWRIDN");
        const myRequest = new MIRequest();
        myRequest.program = "OIS100MI";
        myRequest.transaction = "LstHeadText";
        myRequest.outputFields = ["TX60"];
        myRequest.record = { ORNO: RIDN, TYTR: "1" };

        MIService.Current.executeRequest(myRequest).then((response: IMIResponse) => {
            {
                for (let item of response.items) {
                    textNotes = textNotes + item.TX60 + " ";
                }
                $('#OrderText').val(textNotes);
            }
        }).catch((response: IMIResponse) => {
         //   this.controller.ShowMessage("Unable to receive Notes: " + response.errorMessage);
        });
    }
    private onRequesting(e: CancelRequestEventArgs): void {
       

    }
    private onRequested(args: RequestEventArgs): void {
        document.getElementsByClassName("field-short h5-row h5-filter-options-row")[0].removeChild(document.getElementById("OrderText"));
        this.detachEvents();
    }

    
}