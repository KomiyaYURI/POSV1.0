const _ = require("lodash");
const getInfoFromDB = require('./datbase.js');
const items = getInfoFromDB.loadAllItems();
const promotions = getInfoFromDB.loadPromotions();

/*在同组的dev教导下完成，模仿了代码结构和tasking*/

module.exports = function  printInventory(inputs){

    let cartItem = parseAndCountInput(inputs);
    let purchaseList = generateCartList(cartItem);
    let saveList = calculatuPromotionItem(purchaseList);
    let totalprice = computeTotalAndSave(saveList);
    let mes = renderInventory(totalprice);


    console.log(mes);
    return mes;

};



// const chainConsole = (title) =>(info) => {
//
//     console.log("=======================");
//     console.log(title);
//     console.log("=======================");
//     console.log(info);
// };

// function chainConsole(title) {
//     return function (info) {
//         console.log("=======================");
//         console.log(title);
//         console.log("=======================");
//         console.log(info);
//     }
// }



const parseAndCountInput = (inputs) =>{
    return inputs.reduce((cartItem, element)=>{
        const  [barcode, count = 1] = element.split("-");
        cartItem[barcode] = + count + (cartItem[barcode] || 0)
        return cartItem;
    },{})

}

const generateCartList = (cartItemList) =>{
    return _.reduce(cartItemList, (purchaseList, value, key) =>{
        const purchaseItemInfo = _.clone(items.find(item => item.barcode === key));
        purchaseItemInfo ["count"] = value;
        purchaseList[key] = purchaseItemInfo;
        return purchaseList;
    },{});
};

const calculatuPromotionItem = (purchaseList) => {
    return _.find(promotions,{type: 'BUY_TWO_GET_ONE_FREE'})["barcodes"]
        .reduce((itemList, promotionBarcode) =>{

            const promotionItem = _.clone(purchaseList[promotionBarcode]);
            if (promotionItem) {
                promotionItem["count"] = Math.floor(promotionItem["count"] / 3);
                itemList.saveList[promotionBarcode] = promotionItem;
            }
            return itemList;
        },{
            purchaseList,
            saveList:{}
        })
};

const computeTotalAndSave = (itemList) => {
    const total = _.sumBy(Object.values(itemList["purchaseList"]),
        item=> item.price * item.count);
    const save = _.sumBy(Object.values(itemList["saveList"]),
        item=> item.price * item.count);
    itemList["total"] = total;
    itemList["save"] = save;
    return itemList;
};

const renderInventory = (itemList) => {
    return renderHeading()
        + renderItems(itemList)
        + renderSaveItems(itemList)
        + renderTail(itemList)
        ;
};


const getRealSubPrice = (barcode,itemList) => {
    return itemList["purchaseList"][barcode].price
        * (
            itemList["purchaseList"][barcode].count
            - (itemList["saveList"][barcode] ? itemList["saveList"][barcode].count : 0)
        );
};

const renderItems = (itemList) => {
    return Object.values(itemList["purchaseList"]).reduce((itemsDetail, item) => {
        itemsDetail += `名称：${item.name}，数量：${item.count+item.unit}，单价：${item.price.toFixed(2)}(元)，小计：${getRealSubPrice(item.barcode,itemList).toFixed(2)}(元)\n`;
        return itemsDetail;
    },"");
};

const renderHeading = () => {
    return "***<没钱赚商店>购物清单***\n";
};

const renderSaveItems = (itemList) => {
    const saveDetail = '----------------------\n挥泪赠送商品：\n';
    return Object.values(itemList.saveList).reduce((saveDetail, item) => {
        saveDetail += `名称：${item.name}，数量：${item.count + item.unit}\n`;
        return saveDetail;
    }, saveDetail);
};

const renderTail = (itemList) => {
    return '----------------------\n' +
        `总计：${(itemList.total - itemList.save).toFixed(2)}(元)\n` +
        `节省：${itemList.save.toFixed(2)}(元)\n` +
        '**********************';
};

