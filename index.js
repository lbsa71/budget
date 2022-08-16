import fs from 'fs'
import { exit } from 'process'
import internal from 'stream'

const dir = './exports/'

var cache = {}

const FIRST_MONTH = '2021/08'
const LAST_MONTH = '2022/07'
const FIRST_SAVINGS_MONTH = new Date('2022-08-01')
const MAX_SAVINGS_AMOUNT = 18000

const title_blacklist = [
  "Reservation Kortköp ".toLowerCase(),
]

const own_accounts = [
  { account: "3059 23 21835", category: "Susanne Cooper"},
  { account: "4190 18 69462", category: "Lars Andersson"},
  { account: "4190 00 96605", category: "Ospecificerat,Stefans Lönekonto"},
  { account: "3059 10 50048", category: "Buffertkonto"},
  { account: "4190 00 95633", category: "Ospecificerat,Stefans Visa"},
  { account: "3059 01 66158", category: "Ospecificerat,Hedvigs Visa"},
  { account: "3059 22 86045", category: "Hedvigs Sparkonto"},
] 

const title_map = [
  { startsWith: "Swish betalning".toLowerCase(), category: "Ospecificerat,Kontant"},
  { startsWith: "Swish inbetalning".toLowerCase(), category: "Ospecificerat,Kontant"}, 

  { includes: "Överföring ANDERSSON,STEFAN".toLowerCase(), category: "Överföringar"},  
  { includes: "Överföring SUNDBERG LINDELL,HED".toLowerCase(), category: "Överföringar"},  
 
  { includes: "Lön".toLowerCase(), category: "Anställning,Lön"}, 
  { startsWith: "BARNBDR 198010154824".toLowerCase(), category: "Barn"}, 
  { startsWith: "Studiebidrag 060731-9555".toLowerCase(), category: "Barn"},
  
  { includes: "Skatt".toLowerCase(), category: "Anställning,Skatt"},  
  { includes: "SKATTEVERKET".toLowerCase(), category: "Anställning,Skatt"},  
    
  { includes: "AKAVIA".toLowerCase(), category: "Anställning,Försäkring"}, 
  { includes: "Vårdförbundet".toLowerCase(), category: "Anställning,Försäkring"}, 

  { includes: "COOP ".toLowerCase(), category: "Mat,Livsmedel"},
  { includes: "COOOP ".toLowerCase(), category: "Mat,Livsmedel"}, //!?
  { includes: "ICA".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: "WILLYS".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: "NETTO".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: " FISK".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: "CHARK".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: "Sparhallen".toLowerCase(), category: "Mat,Livsmedel"},  
  { includes: "K supermarket".toLowerCase(), category: "Mat,Livsmedel"}, 
  { includes: "BAGERI".toLowerCase(), category: "Mat,Livsmedel"}, 
  { includes: "GODEBERGS".toLowerCase(), category: "Mat,Livsmedel"}, 
  
  { includes: "PIZZA".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "PIZZERIA".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "RESTAURANG".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "SUSHI".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "MCD".toLowerCase(), category: "Mat,Restaurang"},  
  { includes: "MEKONG".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "KEBNEKAISE".toLowerCase(), category: "Mat,Restaurang"}, 

  { includes: "LILLA SPINNERIET".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "SIBYLLA".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "Seven Vending".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "MASALA KITCHEN".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "PINCHOS".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "FAMILJEN".toLowerCase(), category: "Mat,Restaurang"}, 
  
  { includes: "ESPRESSO".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "KAFFE".toLowerCase(), category: "Mat,Restaurang"}, 
  { includes: "CONDECO".toLowerCase(), category: "Mat,Restaurang"}, 
  
  { includes: "GODIS".toLowerCase(), category: "Mat,Godis"}, 
  { includes: "KANDYZ".toLowerCase(), category: "Mat,Godis"}, 
  
  { includes: "5580-3084 Centrala Stu".toLowerCase(), category: "Studier"},
  
  { startsWith: "Omsättning lån".toLowerCase(), category: "Boende,Lån"},
 
  { includes: "SKOGSBO SAMF".toLowerCase(), category: "Boende,Avgift"},

  { includes: "5233-9330".toLowerCase(), category: "Boende,Energi"},  // Energi
  { includes: "5552-2635".toLowerCase(), category: "Boende,Energi"}, //Ellevio
  { includes: "KJELL O CO".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "JULA".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "BYGGMAX".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "RUSTA".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "BAUHAUS".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "GE KAS".toLowerCase(), category: "Boende,Tillbehör"},
  { includes: "GEKAS".toLowerCase(), category: "Boende,Tillbehör"},
  
  { includes: "Elgiganten".toLowerCase(), category: "Boende,Apparater"},
  { includes: "NETONNET".toLowerCase(), category: "Boende,Apparater"},
  
  { includes: "IKEA".toLowerCase(), category: "Boende,Inredning"},
  { includes: "JYSK".toLowerCase(), category: "Boende,Inredning"},
  
  { includes: "712-7186 FIRMA MIKAEL".toLowerCase(), category: "Boende,ROT"},
  { includes: "5308-5650 TÄRNBRANT LA".toLowerCase(), category: "Boende,ROT"},
  
  { includes: "LINDEX".toLowerCase(), category: "Kläder"},
  { includes: "LAGER 157".toLowerCase(), category: "Kläder"},
  { includes: "ZARA".toLowerCase(), category: "Kläder"},
  { includes: "JACK O JONES".toLowerCase(), category: "Kläder"},
  { includes: "KappAhl".toLowerCase(), category: "Kläder"},
  { includes: "SKOPUNKTEN".toLowerCase(), category: "Kläder"},
  { includes: "ADIDAS".toLowerCase(), category: "Kläder"},
  
  { includes: "5361-1737".toLowerCase(), category: "Kommunikation"}, //Tele2

  { includes: "Systembolaget".toLowerCase(), category: "Upplevelser,Alkohol"}, 
  { includes: "BACKSTAGE ROCKBAR".toLowerCase(), category: "Upplevelser,Alkohol"},
  { includes: "dorsia".toLowerCase(), category: "Upplevelser,Alkohol"},  
 
  { startsWith: "Swish betalning ANDERSSON LINDELL,L".toLowerCase(), category: "Barn,Lisa"},
  { startsWith: "Månadspeng 110507-5343".toLowerCase(), category: "Barn,Lisa"},
  { startsWith: "Swish betalning ANDERSSON LINDELL,E".toLowerCase(), category: "Barn,Ellen"},
  { startsWith: "Månadspeng 080822-5304".toLowerCase(), category: "Barn,Ellen"},
  { startsWith: "Överföring 4249 17 52332".toLowerCase(), category: "Barn,Ellen"},

  { includes: "Gunnebo Rytta".toLowerCase(), category: "Barn,Aktiviteter"},
  { includes: "BLOMGREN, LINNEA".toLowerCase(), category: "Barn,Aktiviteter"},
  { includes: "PAULA JOHNSSON".toLowerCase(), category: "Barn,Aktiviteter"},
  { includes: "ANDREASSONS MUSIK".toLowerCase(), category: "Barn,Aktiviteter"},
  { includes: "BASKET".toLowerCase(), category: "Barn,Aktiviteter"},

  { includes: "LEKIA".toLowerCase(), category: "Barn,Presenter"},
  
  { startsWith: "Swish betalning ANDERSSON LINDELL,V".toLowerCase(), category: "Barn,Viktor"},
  { startsWith: "Överföring 4249 17 36485".toLowerCase(), category: "Barn,Viktor"},
  
  { includes: "UNIVERSEUM".toLowerCase(), category: "Upplevelser"},
  { includes: "Klarna*ticket univer".toLowerCase(), category: "Upplevelser"},
  { includes: "Björn Ek Wahlqvist".toLowerCase(), category: "Upplevelser"}, 
  { includes: "FESTIVALBUSSEN".toLowerCase(), category: "Upplevelser"}, 
  
  { includes: "TICKSTER".toLowerCase(), category: "Upplevelser,Konsert"},
  { includes: "Tidal".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "Spotify".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "NETFLIX".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "SoundCloud".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "Patreon".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "TUNEMYMUSIC".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "APPLE ".toLowerCase(), category: "Upplevelser,Media"},
  { includes: " HBO ".toLowerCase(), category: "Upplevelser,Media"},
   
  { includes: "BIOPALATSET ".toLowerCase(), category: "Upplevelser,Media"},
  { includes: "FILMSTADEN ".toLowerCase(), category: "Upplevelser,Media"},
  
  { includes: "Stena Line".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "GOTLAND".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "liftkort".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "Fjatervale".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "Fjätervåle".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "FJETERVALEN".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "SJ AB".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "ROSELLA".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "HOTELL".toLowerCase(), category: "Upplevelser,Resor"},
  { includes: "LEGOLAND".toLowerCase(), category: "Upplevelser,Resor"},
  
  { includes: "POLISEN 1400 GO".toLowerCase(), category: "Upplevelser,Resor"}, // Pass
  { includes: "Stiftelsen Nordens A".toLowerCase(), category: "Upplevelser,Resor"},
  
  { includes: "AKADEMIBOKHANDE".toLowerCase(), category: "Upplevelser,Litteratur"},
  
  { includes: "VÄSTTRAFIK AB".toLowerCase(), category: "Transport,Kollektivtrafik"},
  { includes: "BG 5051-6822".toLowerCase(), category: "Transport,Skatt"},
  { includes: "TRÄNGSELSKATT".toLowerCase(), category: "Transport,Skatt"},  
  { includes: "Länsförsäkrin".toLowerCase(), category: "Transport,Försäkring"},  
  
  { includes: "INGO".toLowerCase(), category: "Transport,Drivmedel"},
  { includes: "OKQ8".toLowerCase(), category: "Transport,Drivmedel"},
  { includes: "PREEM".toLowerCase(), category: "Transport,Drivmedel"},
  { includes: "CIRCLE K".toLowerCase(), category: "Transport,Drivmedel"},
  { includes: " SHELL ".toLowerCase(), category: "Transport,Drivmedel"},
  
  { includes: "Toyota".toLowerCase(), category: "Transport,Service"},
  { includes: "PARKERING".toLowerCase(), category: "Transport,Parkering"},
  { includes: "EasyPark".toLowerCase(), category: "Transport,Parkering"},
  
  { includes: "BATBIKE".toLowerCase(), category: "Transport,Cykel"},  
  { includes: "SPORTSON".toLowerCase(), category: "Transport,Cykel"},

  { includes: "JBF".toLowerCase(), category: "Djur,Mat"}, 
  { includes: "LINDOME O JÄRN BYGG".toLowerCase(), category: "Djur,Mat"}, 

  { includes: "AGRIA".toLowerCase(), category: "Djur,Försäkring"}, 
  { includes: "IF SKADEFÖRS".toLowerCase(), category: "Försäkring"},
  { includes: "FRISKTANDV".toLowerCase(), category: "Hälsa,Försäkring"}, 
  
  { includes: "Nordea Vardagspaket".toLowerCase(), category: "Avgifter,Bank"}, 
  
  { includes: "NOTKARNAN".toLowerCase(), category: "Hälsa"}, 
  { includes: "NÖTKARNAN".toLowerCase(), category: "Hälsa"}, 
  { includes: "APOTEK".toLowerCase(), category: "Hälsa"},  
  { includes: "LOP O SKO".toLowerCase(), category: "Hälsa"}, 
  { includes: "WALLEY".toLowerCase(), category: "Hälsa"}, 
  
  { includes: "Kicks".toLowerCase(), category: "Skönhet"},
  { includes: "DERMA CURE".toLowerCase(), category: "Skönhet"},
  
  { includes: "SALONG EKEN".toLowerCase(), category: "Skönhet,Frisör"},
  { includes: "KLIPPOTEKET".toLowerCase(), category: "Skönhet,Frisör"},
  { includes: "EXOMEI".toLowerCase(), category: "Skönhet,Frisör"},
  { includes: "BARBERQUICK".toLowerCase(), category: "Skönhet,Frisör"},
  
  { startsWith: "Omsättning lån 3992 33 75501".toLowerCase(), category: "Susanne Cooper"},
  //{ includes: "COOPER,SUSANNE".toLowerCase(), category: "Susanne"},
  //{ startsWith: "Överföring ANDERSSON,LARS".toLowerCase(), category: "Lars"},
  { includes: "Bil 4190 18 69462".toLowerCase(), category: "Lars Andersson"},
  { includes: "Autogiro DNB Finans".toLowerCase(), category: "Lars Andersson"}, 
  
  
  
]

var output;

function process(file, line)
{
  try
  {
      
    if(cache[line] === true)
    {
      console.log("Eliminated Duplicate: " + line)
      return
    }
    else
    {
      cache[line] = true
    }

    const cols = line.split(';')

    const day = cols[0].replaceAll('.', '-')
    const month = day.substr(0, 7)

    const amount = parseInt(cols[1].replace(',', '.'))
    const from = cols[2]
    const to = cols[3]
    const _name = cols[4]
    const orig_title = cols[5]
    const title = orig_title.toLowerCase();
    const balance = cols[6]
    const currency = cols[7]

    var category

    if(month < FIRST_MONTH) return;
    if(month > LAST_MONTH) return;

    if(title_blacklist.some(x => title.startsWith(x)))
    {
      console.log("Title Blacklisted: " + line)
      return;
    }

    if(currency != 'SEK')
    {
      console.log("Currency Blacklisted: " + currency)
      return;
    }


    own_accounts.forEach(map => {
      const account = map.account

      // if(from === account)
      // {
      //   if(title.startsWith("Swish inbetalning SUNDBERG LINDELL,".toLowerCase()) 
      //     || title.startsWith("Swish betalning SUNDBERG LINDELL,HE".toLowerCase())
      //     || title.startsWith("Swish betalning ANDERSSON,STEFAN".toLowerCase())
      //     || title.startsWith("Swish inbetalning ANDERSSON,STEFAN".toLowerCase()))
      //   {
      //     category = "Överföringar"
      //   }
      // }
    
      if(!category)
      {
        if((to === account) || (from === account))
        {
          own_accounts.forEach(target => {
            const pattern = "överföring " + target.account

            if(title.startsWith(pattern))
            {
              category = "Överföringar"
            }
          })
          
          if(!category) {
            category = map.category
          }
        }
      }
    })


    title_map.forEach(map => {
      if(map.startsWith)
      {
        if(title.startsWith(map.startsWith))
        {
          category = map.category
        }
      }

      if(map.includes)
      {
        if(title.includes(map.includes))
        {
          category = map.category
        }
      }
    });

    if(!category)
    {
      category = "Ospecificerat"
    }

    const categories = category.split(',')
    if(categories.length == 1) categories[1]=categories[0]

    w.write(month  + '\t' + day + '\t' + amount  + '\t' + orig_title  + '\t' + from  + '\t' + to  + '\t' + categories.join('\t') + '\n')

    // console.log(amount, title)
  }
  catch(e)
  {
    
    console.log(file)
    console.log(line)
    console.trace()
  }
}

const w = fs.createWriteStream('output.csv')
w.write('Month'  + '\t' + 'Date' + '\t' + 'Amount'  + '\t' + 'Title'  + '\t' + 'From'  + '\t' + 'To' + '\t' + 'Category'  + '\t' + 'Subcategory' + '\n')

const files = fs.readdirSync(dir)

for (const file of files) {

  if(file[0] === '.') continue

  fs.readFile(dir + file, function(err, data) {
    if(err) throw err;

    const lines = (data.toString().replace(/\r\n/g,'\n').split('\n'))
    const header = lines.shift();

    for(let line of lines) {
        process(file, line);
    }
  });
}

const now = Date.parse(FIRST_SAVINGS_MONTH) 
// const day = now.getFullYear() * 100 + now.getMonth() + 1

console.log("Current Month:")

var max_saving_date = ''
var max_saving_amount = 0
var total_saving_amount = 0
const savings = []


function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

function add_savings(line)
{
  const arr=line.split("::")

  if(arr.length > 2)
  {
    const date =new Date(Date.parse(arr[0]))

    // console.log("date:" + date.toString())
    const month = monthDiff(FIRST_SAVINGS_MONTH, date)
    const amount = 1*arr[1]
    const text = arr[2]

    total_saving_amount += amount

    //console.log("From " + FIRST_SAVINGS_MONTH.toLocaleDateString() + " to " + date.toLocaleDateString() + " there is " + month + " to save " + total_saving_amount + " for " + text)

    if(date > max_saving_date) max_saving_date = new Date(date)

    savings.push({month, amount, text})


  //console.log("Number of savings" + savings.length)
  }
}


fs.readFile("savings.txt", function(err, data) {
  if(err) throw err;

  const lines = (data.toString().replace(/\r\n/g,'\n').split('\n'))
  const header = lines.shift()

  for(let line of lines) {
      add_savings(line);
  }

  console.log(max_saving_date.toString())

  const months = monthDiff(FIRST_SAVINGS_MONTH, max_saving_date) + 1
  const mean_savings_per_month = total_saving_amount / months

  // console.log(months)
  //console.log(total_saving_amount)
  // console.log(mean_savings_per_month)
  if(total_saving_amount > (MAX_SAVINGS_AMOUNT*months))
  {
    console.log("This aint gonna fly. You need at least " + mean_savings_per_month + " as MAX_SAVINGS_AMOUNT")
    exit(0)
  }
  const per_month = Array.apply(null, Array(months)).map(function (x, i) { return 0; })

  // Allocating
  for(var s=0;s<savings.length;s++)
  {
    const saving=savings[s]

   // console.log("applying saving "+saving.month+" for a total of "+saving.amount)

    per_month[saving.month] += saving.amount
  }


  // Smoothing
  var limit_hit = true

  for(var iter=0;iter<10000 && limit_hit;iter++)
  {

    for(var month=1;month<months;month++)
    {
        var month_before=month-1
        
        const amt = (per_month[month] - per_month[month_before]) / 2

        if(amt > 0)
        {
          const new_month_before = per_month[month_before] + amt

          per_month[month] -= amt
          per_month[month_before] = new_month_before

          // console.log("Moving " + amt + " from month " + month + " to " + month_before)
        } 
    }

    limit_hit = false

    for(var month=0;month<months;month++)
    {
      if(per_month[month] > MAX_SAVINGS_AMOUNT)
      {
        limit_hit = true
      }
    }
  }

  var total = 0;

  for(var month=0;month<months;month++)
  {
    const date = new Date(FIRST_SAVINGS_MONTH)
    date.setMonth(date.getMonth() + month)

    const dateStr = date.getFullYear() + "/" + (date.getMonth() + 1)

    total += per_month[month]

    console.log(dateStr + ":+" + parseInt(per_month[month]) + "  ==>" + parseInt(total))

    if(per_month[month] > MAX_SAVINGS_AMOUNT)
    {
      console.log("!!!TOO MUCH SAVING!!!")
    }

    for(var s=0;s<savings.length;s++)
    {
      const saving=savings[s]

      if(saving.month == month) {
        total -= saving.amount
        console.log("   " + dateStr + ":-"+saving.amount +" (" + saving.text+")  ==>" + parseInt(total))
      }
    }
  }
})
