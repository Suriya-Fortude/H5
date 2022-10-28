/**
** Dispaly Quantity Total for the selected lines in List View
**
** Developed By: SuriyaN@fortude.co
** Date: 2022-04-27
**
**/
class OIS301_Total { /** * Script initialization function. */
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private orderTypeArray;
    private contentElement;

    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
        this.contentElement = scriptArgs.controller.GetContentElement();
    }
    public static Init(args: IScriptArgs): void {

        new OIS301_Total(args).run();
    }

    /**
   *
   * When lines are selected from list view, fetch the line
   * quantites of selected lines, sum it up and display in label
   *
   * */
    public run(): void {

        const Label = new LabelElement();
        Label.Name = "QuantityTotal";
        Label.Value = "Total Quantity = 0.00";
        Label.Position = new PositionElement();
        Label.Position.Top = 3;
        Label.Position.Left = 50;
        Label.Position.Width = 50;
        const controller = this.controller;
        const label = this.contentElement.AddElement(Label);
        const LabelNet = new LabelElement();
        LabelNet.Name = "NetTotalValue";
        LabelNet.Value = "Net Amount = 0.00";
        LabelNet.Position = new PositionElement();
        LabelNet.Position.Top = 3;
        LabelNet.Position.Left = 65;
        LabelNet.Position.Width = 50;
        const labelNet = this.contentElement.AddElement(LabelNet);
        const list = this.controller.GetGrid();
        const handler = (e, args) => {
            this.onSelectionChanged(e, args);
        };
        list.onSelectedRowsChanged.subscribe(handler);
    }
    private onSelectionChanged(e: any, args: any): void {
        var selectedCount: number = 0;
        var Currentlyselected = ListControl.ListView.SelectedItem().length;
        var totalQuantity = 0.00;
        var totalAmount = 0.00;
        if (Currentlyselected != selectedCount || selectedCount === 0) {
            let selected = ListControl.ListView.SelectedItem();
            let lineQuantity = ListControl.ListView.GetValueByColumnName("ORQA");
            console.log(lineQuantity.length);
            if (lineQuantity.length === 0) {
                lineQuantity = ListControl.ListView.GetValueByColumnName("ORQT");
            }
            let lineamount = ListControl.ListView.GetValueByColumnName("LNAM");
            for (var i = 0; i < lineQuantity.length; i++) {
                if (lineQuantity[i]) {

                    if (lineQuantity[i].indexOf('-') >= 0) {
                        totalQuantity = totalQuantity - parseFloat(lineQuantity[i]);
                        totalAmount = totalAmount - parseFloat(lineamount[i]);
                    } else {
                        totalQuantity = totalQuantity + parseFloat(lineQuantity[i]);
                        totalAmount = totalAmount + parseFloat(lineamount[i]);
                    }
                }
            }
            totalQuantity = totalQuantity || 0;
            totalAmount = totalAmount || 0;
            document.getElementById("QuantityTotal").innerHTML = "Total Quantity: " + Math.round(totalQuantity * 100) / 100;
            selectedCount = Currentlyselected;
            document.getElementById("NetTotalValue").innerHTML = "Net Amount: " + Math.round(totalAmount * 100) / 100;
        } else {
            let lineQuantity = ListControl.ListView.GetValueByColumnName("ORQA");
            let lineamount = ListControl.ListView.GetValueByColumnName("LNAM");
            if (lineQuantity.length > 0 || lineamount.length > 0) {

                document.getElementById("QuantityTotal").innerHTML = "Total Quantity: " + (lineQuantity[0] || 0);
                document.getElementById("NetTotalValue").innerHTML = "Net Amount: " + (lineamount[0] || 0);
            }



        }
    }

}
