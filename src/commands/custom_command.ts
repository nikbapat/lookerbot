import * as _ from "underscore"
import config from "../config"
import { Looker } from "../looker"
import { DashboardQueryRunner } from "../repliers/dashboard_query_runner"
import { ReplyContext } from "../reply_context"
import { Command } from "./command"

export class CustomCommand extends Command {

  public attempt(context: ReplyContext) {
    const normalizedText = context.sourceMessage.text.toLowerCase().replace("*", "").replace("*", "") // lowercase
    const shortCommands = _.sortBy(_.values(Looker.customCommands), (c) => -c.name.length) // sorts commands by name length
    const matchedCommand = shortCommands.filter((c) => normalizedText.indexOf(c.name) === 0)[0] // finds the matching command
    if (matchedCommand) {

      const { dashboard } = matchedCommand // finds appropriate dashboard
      const query = context.sourceMessage.text.replace("*", "").replace("*", "").slice(matchedCommand.name.length).trim() // separates command from parameters
      normalizedText.indexOf(matchedCommand.name) // doesnt seem to do anything?

      context.looker = matchedCommand.looker

      const filters: {[key: string]: string} = {} // creates new filters dict
      const dashboardFilters = dashboard.dashboard_filters || dashboard.filters // Looker API dashboard type has both

      var params = query.split(";")
      var usedFilters = dashboardFilters.slice(0, params.length)

      var iterator = params.values()
      usedFilters.forEach(function (value: any) {
        filters[value.name] = iterator.next().value
      })


      const runner = new DashboardQueryRunner(context, matchedCommand.dashboard, filters) // calls results from Looker API
      runner.start()

      return true
    } else {
      return false
    }
  }

}
