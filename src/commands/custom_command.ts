import * as _ from "underscore"
import config from "../config"
import { Looker } from "../looker"
import { DashboardQueryRunner } from "../repliers/dashboard_query_runner"
import { ReplyContext } from "../reply_context"
import { Command } from "./command"

export class CustomCommand extends Command {

  public attempt(context: ReplyContext) {
    const normalizedText = context.sourceMessage.text.toLowerCase() // lowercase
    const shortCommands = _.sortBy(_.values(Looker.customCommands), (c) => -c.name.length) // sorts commands by name length
    const matchedCommand = shortCommands.filter((c) => normalizedText.indexOf(c.name) === 0)[0] // finds the matching command
    if (matchedCommand) {

      const { dashboard } = matchedCommand // finds appropriate dashboard
      const query = context.sourceMessage.text.slice(matchedCommand.name.length).trim() // separates command from parameters
      normalizedText.indexOf(matchedCommand.name) // doesnt seem to do anything?

      context.looker = matchedCommand.looker

      const filters: {[key: string]: string} = {} // creates new filters dict
      const dashboardFilters = dashboard.dashboard_filters || dashboard.filters // Looker API dashboard type has both
      console.log(dashboardFilters)
      var params = query.split(";")
      console.log(params)
      var usedFilters = dashboardFilters.slice(0, params.length)
      console.log(usedFilters)
      var iterator = params.values()
      usedFilters.forEach(function (value: string) {
        filters[value] = iterator.next().value
      })
      console.log(filters)

      const runner = new DashboardQueryRunner(context, matchedCommand.dashboard, filters) // calls results from Looker API
      runner.start()

      return true
    } else {
      return false
    }
  }

}
