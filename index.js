const request = require('request')
request.debug = true
require('request-debug')(request);

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Ignore 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' authorization error

const cheerio = require('cheerio')
const url = require('url')
const querystring = require('querystring')
const tabletojson = require('tabletojson')

const login_base_url = "https://internetbanken.privat.nordea.se/nsp/login"
const core_base_url = "https://internetbanken.privat.nordea.se/nsp/core"

function getOptions(url) {
  console.log("Sleeping...")

  return {
    proxy: "http://127.0.0.1:8888",
    url: url,
    jar: true,
     headers: {
       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36",
       "Accept-Language": "sv,sv-SE;q=0.9,en-US;q=0.8,en;q=0.7",
       "Cache-Control": "max-age=0",
       "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
    //   "Accept-Encoding": "gzip, deflate, br",
       "Connection": "keep-alive",
       "Sec-Fetch-Mode": "navigate",
       "Sec-Fetch-Site": "same-origin",
       "Upgrade-Insecure-Requests": "1",
       "Host": "internetbanken.privat.nordea.se",
       "Origin": "https://internetbanken.privat.nordea.se"
     }
  }
}

function onLoadAccountPage(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//  console.log('body:', body); // Print the HTML for the Google homepage.


  // currentaccountsoverviewtable

  const $ = cheerio.load(body);

// <a href="login?usecase=commonlogin&amp;command=commonlogintabcommand&amp;guid=a6L2j8v10qERP5HKBZAw4gCC&amp;commandorigin=0.commonlogintabview_SE&amp;fpid=9w0jTYoTAG0u43ZyYCysoACC7048933529372305819xxxxxxxxx&amp;commonlogintab=2&amp;hash=MUyOq7U85eXcOfeHjBU7xACC"></a>

//console.log("table:")

  const account_table_element = $('#currentaccountsoverviewtable')

  // console.log(account_table_element)

  const account_table_html = $.html(account_table_element)

  // console.log(account_table_html)

  const outer_converted_table = tabletojson.convert(account_table_html, {stripHtmlFromCells: false});
  const converted_table = outer_converted_table[0]; // Why on earth do tabletojson wrap this in extra dimension?

//  console.log(converted_table);

  var accounts = []

  for(var i=0;i<converted_table.length;i++)
  {
    const row = converted_table[i]

    const row_name_html = row["Namn"]

  //  console.log("parsing " + row_name_html)

    const $ = cheerio.load(row_name_html)
    const name_element = $("A")

    const url = name_element.attr("href")
    const name = name_element.text()
    const acct = row["Kontonummer"].replace("*", "")

     accounts.push({
       name,
       url,
       acct
     })
  }

//  console.log(accounts)


  const first_account_relative_url = accounts[0].url

  const absolute_first_account_link = new URL(first_account_relative_url, login_base_url)

  const options = getOptions(absolute_first_account_link)

  console.log("Loading first account:")

  request.get(options, onLoadFirstAccountOverview)
}

function getFormState($)
{
  const guid = $("input[name=guid]").val()
  const commandorigin = $("input[name=commandorigin]").val()
  const fpid = $("input[name=fpid]").val()
  const hash = $("input[name=hash]").val()

  console.log("guid:" + guid + " commandorigin:" + commandorigin + " fpid:" + fpid + " hash:" + hash + "")

  const usecase = "base"
  const command = "formcommand"

  return {
    usecase,
    command,
   guid,
   commandorigin,
   fpid,
   hash

   // ,JAVASCRIPT_DETECTED
  }
}

function onLoadSpecifiedAccountAndMonthPage(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//  console.log('body:', body); // Print the HTML for the Google homepage.
}

function onLoadCSV(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
 console.log('body:', body); // Print the HTML for the Google homepage.
}

let sleep = require('util').promisify(setTimeout)

function loadSpecifiedAccountAndMonthPage($, referer)
{
  var form = getFormState($)

  form.defaultcommand = "accounttransactions$getnewaccounttransactions"
  form.commandorigin = "0.ucaccounttransactionstabcw"
//  form["accounttransactions$basicsearchtransactions"]="&nbsp;&nbsp;Fortsätt&nbsp;&nbsp"
  form.transactionaccount	= 1
  form.transactionPeriod = 0

//  options.headers['Content-Length'] = postData.length

//  console.log("POSTing login ---")

  const options = getOptions(core_base_url)
  options.form = form
  options.headers.Referer = referer
  options.headers["Accept-Encoding"] ="gzip, deflate, br"
  options.headers['Content-Type'] = 'application/x-www-form-urlencoded'

  console.log("Loading 1/1:")

  sleep(10000).then(() => request.post(options, onLoadSpecifiedAccountAndMonthPage))
}

function loadCSV($)
{
   const relative_CSV_link = $('a:contains("CSV")').attr('href')

   console.log("relative_CSV_link:" + relative_CSV_link)

   const absolute_CSV_link = new URL(relative_CSV_link, login_base_url)

   console.log("absolute_CSV_link:" + absolute_CSV_link)

   const options = getOptions(absolute_CSV_link)

   request.get(options, onLoadCSV)
}

function onLoadFirstAccountOverview(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//  console.log('body:', body); // Print the HTML for the Google homepage.

  const $ = cheerio.load(body);

  loadSpecifiedAccountAndMonthPage($, response.request.uri)
  // loadCSV($)
}


function onLoadSimpleLoginForm(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//  console.log('body:', body); // Print the HTML for the Google homepage.

  const $ = cheerio.load(body);

  var form = getFormState($)

  form.userid = "197102162539"
  form.pin = '0820'
  form["commonlogin$loginLight"] = "Logga in"
  form.JAVASCRIPT_DETECTED = true

//  options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
//  options.headers['Content-Length'] = postData.length

//  console.log("POSTing login ---")

  const options = getOptions(login_base_url)
  options.form = form

  request.post(options, onLoadAccountPage)

  // Betalning PG/BG
}

function onLoadDefaultLoginPage(error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  // console.log('body:', body); // Print the HTML for the Google homepage.

  const $ = cheerio.load(body);

// <a href="login?usecase=commonlogin&amp;command=commonlogintabcommand&amp;guid=a6L2j8v10qERP5HKBZAw4gCC&amp;commandorigin=0.commonlogintabview_SE&amp;fpid=9w0jTYoTAG0u43ZyYCysoACC7048933529372305819xxxxxxxxx&amp;commonlogintab=2&amp;hash=MUyOq7U85eXcOfeHjBU7xACC"></a>
  const relative_login_link = $('a:contains("renklad inloggning")').attr('href')

  console.log("relative_login_link:" + relative_login_link)

  const absolute_login_link = new URL(relative_login_link, login_base_url)

  console.log("absolute_login_link:" + absolute_login_link)

  const options = getOptions(absolute_login_link)

  request.get(options, onLoadSimpleLoginForm)
}

const options = getOptions(login_base_url)
const loadLoginPage = request.get(options, onLoadDefaultLoginPage)
