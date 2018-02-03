// @flow
import _ from 'lodash'

// $FlowIgnore
const context = require.context('$lb/', true, /\.studioSocketEndpoint\.tsx$/)
const listOfModulePaths: Array<string> = context.keys()
const requireModuleByPath: typeof require = context
const handlersByName = _.mapValues(
  _.keyBy(listOfModulePaths, s => {
    const matches: Array<string> = s.match(
      /\/([a-zA-Z]+)\.studioSocketEndpoint\.tsx$/,
    ) as $IntentionalAny
    return matches[1]
  }),
  localePath => requireModuleByPath(localePath).default,
)

export default handlersByName