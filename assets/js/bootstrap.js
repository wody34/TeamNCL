'use strict';


requirejs.config({
  'baseUrl': 'js',
  'paths': {
    'async': '/lib/requirejs-plugins/async',
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
    // 'tmap': 'https://apis.skplanetx.com/tmap/js?version=1&format=javascript&appKey=35bfd940-2738-36fa-9502-f25ddde1ed96',
    'angular': '/lib/angular.min',
    'lodash': '/lib/lodash.min',
    'sails.io': '/js/dependencies/sails.io',
    'tracking': '/lib/tracking-min'
  },
  shim:{
    'angular':{
      deps:['jquery'],
      exports:'angular'
    },
    'lodash': {
      exports: '_'
    },
    'sails.io': {
      exports: 'io'
    },
    'app':{
      deps:[
        'angular',
        'lodash',
        'tracking'
      ]
    }
  }
});


requirejs( [
    'jquery', //미리 선언해둔 path, jQuery는 AMD를 지원하기 때문에 이렇게 로드해도 jQuery 또는 $로 호출할 수 있다.
    'angular', //미리 선언해둔 path
    'app' //app.js
  ],

  //디펜던시 로드뒤 콜백함수
  function ($, angular) {
    //이 함수는 위에 명시된 모든 디펜던시들이 다 로드된 뒤에 호출된다.
    //주의해야할 것은, 디펜던시 로드 완료 시점이 페이지가 완전히 로드되기 전 일 수도 있다는 사실이다.

    //페이지가 완전히 로드된 뒤에 실행
    $(document).ready(function () {

      //위의 디펜던시 중 myApp이 포함된 app.js가 로드된 이후에 아래가 수행된다.
      //임의로 앵귤러 부트스트래핑을 수행한다.

      angular.bootstrap(document, ['TeamNCL']);
    });

  }
);
