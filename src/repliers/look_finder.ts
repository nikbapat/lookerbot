import { ILook } from "../looker_api_types"
import { ReplyContext } from "../reply_context"
import { QueryRunner } from "./query_runner"


const fuzzySearch = require("fuzzysearch-js")
const levenshteinFS = require("fuzzysearch-js/js/modules/LevenshteinFS")
const IndexOfFS = require("fuzzysearch-js/js/modules/IndexOfFS")
const WordCountFS = require("fuzzysearch-js/js/modules/WordCountFS")

export class LookFinder extends QueryRunner {

  constructor(replyContext: ReplyContext, private type: string, private query: string) {
    super(replyContext)
    this.type = type
    this.query = query
  }


  protected async work() {
    const results = await this.matchLooks()

    if (results) {
      const shortResults = results.slice(0, 5)
      console.log(shortResults)
      shortResults.forEach(function (value: any){
        console.log(value.details)
      })
      this.reply({
        attachments: shortResults.map((v: any) => {
          const look = v.value
          return {
            text: `in ${look.space.name}`,
            title: look.title,
            title_link: `${this.replyContext.looker.url}${look.short_url}`,
          }
        }),
        text: "Matching Looks:",
      })
    } else {
      this.reply(`No Looks match \"${this.query}\".`)
    }
  }

  private async matchLooks() {
    const looks = await this.replyContext.looker.client.getAsync(
      "looks?fields=id,title,short_url,space(name,id)",
      this.replyContext,
    )

    const dashes = await this.replyContext.looker.client.getAsync(
      "dashboards?fields=id,title,short_url,space(name,id)",
      this.replyContext,
    )
    
    dashes.forEach(function (value: any){
      value.short_url = "/dashboards/" + value.id
    })

    const searchTerms = dashes.concat(looks)
  
    const searcher = new fuzzySearch(searchTerms, {termPath: "title"})
    searcher.addModule(levenshteinFS({maxDistanceTolerance: 3, factor: 3}))
    searcher.addModule(IndexOfFS({'minTermLength': 3, 'maxIterations': 500, 'factor': 3}));
    searcher.addModule(WordCountFS({'maxWordTolerance': 3, 'factor': 1}))
    const results = searcher.search(this.query)

    return results
  }


}
