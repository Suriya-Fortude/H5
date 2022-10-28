/**
** Dispaly Quantity Total for the selected lines in List View
**
** Developed By: SuriyaN@fortude.co
** Date: 2022-04-27
**
**/
class ButtonPrintCRS678 { /** * Script initialization function. */
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private orderTypeArray;
    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
    }

    /**
     * 
     * Add a button to the screen.Upon clicking automatically
     * copies the schedule number to CRS687, prints and closes 
     * the screen. 
     * 
     * @param args
     * @param controller
     */
    public static Init(args: IScriptArgs, controller: IInstanceController): void {
        new ButtonPrintCRS678(args).run(args);
    }
    private run(args) {
        var MONumebr = ScriptUtil.GetFieldValue("WOPLGR");
        if (MONumebr == "MONGOOSE") {                   //If source Mongoose, print and close for schedule. 
            this.callCRS678(true);
        }
        const buttonElement = new ButtonElement();      //Create button to trigger Mforms. 
        buttonElement.Name = "Print ICT";
        buttonElement.Value = "Print ICT";
        buttonElement.Position = new PositionElement();
        buttonElement.Position.Top = 3;
        buttonElement.Position.Left = 50;
        buttonElement.Position.Width = 5;
        const contentElement = args.controller.GetContentElement();
        const button = contentElement.AddElement(buttonElement);
        button.click({}, () => {
            this.callCRS678(false);
        });
    }
    
    private async callCRS678(isMongoose){
        var scheduleText = ScriptUtil.GetFieldValue("WOSCHN");
        if (scheduleText != null) {                 //Trigger Mforms to CRS678 if button clicked and schedule number not empty
            var schedulenumber = scheduleText;
            var auto = new MFormsAutomation();
            auto.addStep(ActionType.Run, "CRS678");
            auto.addStep(ActionType.Key, "ENTER");
            auto.addStep(ActionType.Key, "ENTER");
            auto.addField("WFSCHN", schedulenumber);
            auto.addField("WTSCHN", schedulenumber);
            auto.addStep(ActionType.Key, "F12");
            var uri = auto.toEncodedUri()
            ScriptUtil.Launch(uri);
            if (isMongoose) {
                console.log("Delay start")
                await this.delay(1000);
                console.log("Closing")
                this.controller.PressKey("F3");
            }

        }
    }

    private delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
    }


   }