const mongoose=require('mongoose');

const scrapedDataSchema=new mongoose.Schema({
    url:{ type:String,required:true},
    title: String,
    content:String,
    markdown:String,
    scrapedAt: { type: Date, default: Date.now },
    metadata: {
      description: String,
      keywords: [String],
      author: String
    }    
});

const ScrapedData=mongoose.model('ScrapedData',scrapedDataSchema);

module.exports=ScrapedData;