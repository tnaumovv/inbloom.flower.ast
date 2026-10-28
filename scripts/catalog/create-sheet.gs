// Optional helper if a separate catalogue copy is needed later.
// The current table was created and populated already; this is not required to edit prices.
function createInBloomCatalogue() {
  const book = SpreadsheetApp.create('In Bloom — каталог букетов');
  const sheet = book.getActiveSheet().setName('Каталог');
  sheet.getRange(1, 1, 1, 9).setValues([['ID','Название','Цена','Фото','Описание','Состав','Показывать','Порядок','Категория']]).setFontWeight('bold').setBackground('#FFE3EF');
  sheet.setFrozenRows(1);
  sheet.getRange('G2:G1001').insertCheckboxes();
  sheet.setColumnWidth(2, 200); sheet.setColumnWidth(3, 110); sheet.setColumnWidth(4, 340);
  console.log(book.getUrl());
}
