# install
```
npm install react-lingost
```

# Usage
### 1. create `./lingost/` Directory and create `./lingost/index.js` and write below
```js
import { createState } from 'react-lingost'

let user = createState('user', {
    logged: false,
    data:{},
    test:[1,2,3,4],
})

module.exports = {
    user,
}
```

## 2. ./app.js
### (1) Import `react-lingost` module
```js
import { passStateToProps } from 'react-lingost'
```
### (2) Enclose the your app component with the passStateToProps function
```js
function stateToProps( { user } ) {
    return {
        logged: user.logged,
        test: user.test[0]
    }
}
export default passStateToProps(stateToProps)(App)
```
### (3) Update State Anywhere
```js
import { user } from './lingost/index.js'

...

user.setState({
    logged: true
}) // update state and reRender
```

# react-lingost
+ react-lingost의 외부 상태는 어디서든 업데이트 할 수있습니다.
+ stateToProps가 변하지 않는다면 re-Rendering 되지 않습니다.
    ```js
    let user = createState('user', {
        logged: false,
        data:{},
        test:[1,2,3,4],
    })
    function stateToProps( { user } ) {
        return {
            logged: user.logged,
            test: user.test[0]
        }
    }
    export default passStateToProps(stateToProps)(App)
    
    
    user.setState({
        test:[1,2,3]
    })
    /*
    이 경우에는 setState를 호출해도 re-Rendering 되지 않습니다.
    App은 { test: user.test[0] } 를 참조하고 있는데
    위의 setState를 호출하더라도 user.test[0]의 결과는 바뀌지 않기 때문입니다.
    
    In this case, calling setState does not re-render.
    App refers to {test: user.test [0]}
    This is because calling setState does not change the result of user.test [0].
    */
    ```
## Precautions
```js
// dont use below, it will not working
function stateToProps( state ) {
    return { state }
}

// you can use,
function stateToProps({ user }) {
    return { nickname: user.nickname }
}

// or
function stateToProps(state) {
    return { nickname: state.user.nickname }
}

// `function stateToProps()`  에서 사용되는 state값은 항상 'String', 'Number', 'Boolean' 형태여야합니다
// The state value used in `function stateToProps ()` should always be of type 'String', 'Number', 'Boolean'

// `return {user: state.user}` 처럼 'Object'를 반환하지 말고, `return {nickname: state.user.nickname}`처럼 'String', 'Number', 'Boolean'를 반환하세요.
// `return { user:{ nickname: state.user.nickname } }` 이런 형태도 가능합니다.
// state를 사용한 값에 대해서만 'String', 'Number', 'Boolean'가 반환되게 해주세요.

// Do not return 'Object' like `return {user: state.user}`, but return 'String', 'Number', 'Boolean' like `return {nickname: state.user.nickname}`
// `return {user: {nickname: state.user.nickname}}` This type is also possible.
// Just let 'String', 'Number', 'Boolean' be returned for values using state.
```

# Example
### Use with the component wrapper function, such as `LangReloader` in` react-g-lang`.
`react-g-lang`의 `LangReloader`와 같은, component wrapper function과 함께 쓰기

+ Before
```js
import { setLanguage, setLanguages, onChangeLanguage } from 'g-lang'
import { lang, LangReloader } from 'react-g-lang'

export default LangReloader(App)
```
+ After
```js
import { setLanguage, setLanguages, onChangeLanguage } from 'g-lang'
import { lang, LangReloader } from 'react-g-lang'
import { createState, passStateToProps, useMiddleware } from 'react-lingost'

useMiddleware(LangReloader) // <<== add this


export default passStateToProps(App)
```

# Example
### createState
```js
import { createState } from 'react-lingost'
// make state
let user = createState('stateName', { title:'abcd' })

// 
/*
`user` variable has the following methods
    setState
    notReRenderedInRealtimeState
*/
```

### passStateToProps
```js
import { passStateToProps } from 'react-lingost'

const stateToProps = ( { stateName } ) => ({
    title: stateName.title
})
const __Test1 = (props)=>(<Text>{props.name}</Text>)
const Test1 = passStateToProps( stateToProps )( __Test1 )

// <Test1 /> Component will be <Test1 title='abcd' />
```

### useMiddleware
+ See the example above

### createState.setState
```js
user.setState({ title:'abcde' })
// The above code will replace <Test1 title='abcd' /> with <Test1 title='abcde' />

user.setState({ descripiton:'hi' })
// The above code will not re-render <Test1 />, because Test1 does not refer to stateName.description
```
