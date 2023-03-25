let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    chrome = require("chrome-aws-lambda");
    puppeteer = require("puppeteer-core");
  } else {
    puppeteer = require("puppeteer");
  }

  const five = async (search) => {
    let options = {};

    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options = {
        args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      };
    }

    try {
      let browser = await puppeteer.launch(options);
      let page = await browser.newPage();
      await page.goto(`https://www.truemeds.in/search/`);
      await page.waitForSelector(".search-input");
      await page.type(".search-input", search);
      await page.keyboard.press("Enter");
      await page.waitForSelector(".sc-dacFzL .medName");
      
      firstname = await page.evaluate(() => {
        headings_elements = document.querySelectorAll(".sc-dacFzL .medName");
        headings_array = Array.from(headings_elements);
        return headings_array.map(heading => heading.textContent);
      });

      mrp = await page.evaluate(() => {
        headings_elements = document.querySelectorAll(".main-prices-container .mrp-price");
        headings_array = Array.from(headings_elements);
        return headings_array.map(heading => heading.textContent);
      });

      actualPrice = await page.evaluate(() => {
        headings_elements = document.querySelectorAll(".main-prices-container .selling-price");
        headings_array = Array.from(headings_elements);
        return headings_array.map(heading => heading.textContent);
      });

      linklist = await page.evaluate(() => {
          const imagelist = Array.from(document.querySelectorAll(".sc-kIeTtH .sc-dtwoBo")).map(x => {
                const img = x.querySelector("img");
                if (!img) return ""; // or return a default image URL
                return img.src;
              });
              return imagelist;
      });
      
      

      
      // "https://assets.truemeds.in/Images/ProductImage/TM-GEEL1-001118/VOLINI-1.16--GEL-75-GM_1.webp?tr=cm-pad_resize,bg-FFFFFF,lo-true,w-80"
      // "https://www.truemeds.in/medicine/volini-116-gel-75-gm-TM-GEEL1-001118"
      // "https://www.truemeds.in/otc/volini-116-gel-75-gm-tm-geel1-001118"

      const fmList = [];
      const smList = [];
      const ssList = [];
      const tmList = [];
      const modifiedList = [];
      for(let i=0;i<linklist.length;i++){
        if(linklist[i].indexOf("ProductImage/")!==-1){
          fmList[i] = linklist[i].slice(linklist[i].indexOf("ProductImage/")+13,linklist[i].indexOf("_1.webp"));
        }else{
          fmList[i] = "";
        }
        if(fmList[i]!==""){
          smList[i]=fmList[i].slice(0,fmList[i].indexOf("/"));
          ssList[i]=smList[i].toLowerCase();
          tmList[i]=fmList[i].slice(fmList[i].indexOf("/")+1);
          tmList[i]=tmList[i].toLowerCase();
          tmList[i]=tmList[i].replace(".","");
          tmList[i]=tmList[i].replace("--","-");
          modifiedList[i] = `https://www.truemeds.in/otc/${tmList[i]}-${ssList[i]}`;
        }else{
          ssList[i]="";
          tmList[i]="";
          modifiedList[i]="";
        }
      }



      
      const pharmas = [];
        for (let i = 0; i < 30; i++) {
          const netmeds = { index: i,name:"",actualPrice:"",mrp:"",image: "" ,link:"" };
           if (modifiedList[i] !== "") {
           netmeds.name = firstname[i];
           if(actualPrice[i]!==undefined){
             actualPrice[i] = actualPrice[i].replace(" ₹","");
             mrp[i] = mrp[i].replace("MRP ₹","");
           }
            netmeds.actualPrice = actualPrice[i];
            netmeds.mrp = mrp[i];
           netmeds.link = modifiedList[i];
         }else{
            netmeds.name = "";
            netmeds.actualPrice = "";
            netmeds.mrp = "";
            netmeds.link = "";
         }
          pharmas.push(netmeds);
        }



      await browser.close();
      return pharmas;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  const getTruemeds = (e) => {
    return five(e);}

module.exports = { getTruemeds};
