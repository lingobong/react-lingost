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

```
