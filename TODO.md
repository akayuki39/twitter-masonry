点击推特卡片之后打开一个单独的推特详情卡。
原本的页面保持不变，详情卡浮现在页面上方。原本页面作为背景变暗
media的type如果是photo的话，在详情卡里加载原图。原图通过在图片url后面加上?name=orig来获取。
点击详情卡之外的部分可以关闭详情卡

详情卡加载原图但是如果比屏幕显示还大的话，显示会出界。
我想让详情卡被完整显示的同时，保持最大尺寸保持不变，不受图片大小影响。也就是对图片最大大小做限制。

现在正常了。但是还有一个问题。
当我点开详情卡之后，就会触发加载新推文的逻辑。需要做修正

如果详情卡中有多个图片，把它们做成手动左右滑动切换显示的效果。不要把所有图都显示出来
需要做一个图片轮播组件，但是不要自动轮播，只需要在左右两侧添加箭头按钮，点击按钮或者左右方向键可以切换显示不同的图片。
左右箭头按钮默认不显示，只有hover到图片时才显示。

点击用户头像，name，screen name的时候跳转到该用户的推特页面。
hover到头像的时候让头像略微变暗来做为提示。hover到name的时候添加下划线。screen name不做hover提示

在推特卡里点击图片的时候，详情页直接显示对应的图片

被转发的推特现在显示的是转发的人的头像和名字。
设计被转发推特的显示。
* 如果是转发推文，legacy里会有一个retweeted_status_result。这里面有被转的推文的result。retweeted_status_result.result.legacy就能获取到被转到推文信息了。
    * 参考old/hometimeline_example.json里的"id_str": "2010191615474958371"部分对应的结构, 直接搜索就行
    * 推文的信息都要显示被转的推的。在推特卡最上面显示一下是谁转推的就行。retweet icon + 空格 + 转推人的name + 空格 + 以转帖。也许用font awesome的icon就可以？选择一个好看且轻量的就行。

被转推的推文如果带着quote的话，quote不会被显示。
* old/hometimeline_example_retweet_w_quote.jso里可以搜索2010665935150121270查看json数据结构

设计quote推文的界面。
* 如果是quote推文（带文字转发），result.quoted_status_result.result能获得被quote的推文result。跟转发不同这个不在legacy里

带quote的推文的detail card，会因为quote过长而导致下面的显示不出来。
暂时先设置成如果过长就可以滚动吧，不过滚动条要隐藏。
后面要改一下quote卡片的设计

detail里quote部分也用carousel来滚动显示图片

换行符和html标记也没有渲染出来

有图片的推文，文字内容里最后还带着一个图片链接。有办法处理掉吗？
* result.legacy.extended_entities.url里会有这个链接。如果在这里就给去掉
* 实际上有个legacy.display_text_range，里面是full_text里实际文本的range。用这个就能去掉最后的链接了。

脚本头添加github自动更新的字段
* @updateURL以及@downloadURL等

而且文字显示的也不全，内容长的话后面就没了。怀疑用的text来源不对。
* 超过140个字符的属于note_tweet，在json例子里搜下
* 在详情卡里把全文显示出来

推文本身是note_tweet的情况下再quote其他推文，被quote的推文不会被正确显示，而是显示unknown
* 也有的是因为quoted_status_result.result里的结构不太一样。有的是直接给result，有的需要再调用一层?.tweet才能得到正常的结果。查看tweetdetail_w_special_quote.json
    * 这个例子里被quote的推文的类型是TweetWithVisibilityResults，而不是Tweet。这个例子里是推文quote推文quote推文，最里面的不在api里显示。
* 有时候是推主自己转自己的情况下也会出这个问题。看看。
    * https://x.com/calameuyamuya/status/2013818303899410569
* 原因是因为TweetWithVisibilityResults。针对这种情况做处理

有时候会出现转推没有被成功渲染，而是渲染了RT的那条推特。原因暂时未知
* https://x.com/7H4ZE/status/2013932246173171878

有些emoji不能被正确显示
* 是在最末尾的emoji不能正确显示。也许是因为index切割的时候切出了问题？
    * 确实是因为index切割出了问题。末尾显示成\uD83D\uDE2D，会被切成\uD83D。看样子是编码出问题了
    * js里用的是UTF-16储存string。需要用Array.from(str)给转过来，这个是Unicode code point单位分割的。
* 例子：https://x.com/Park_MuJu/status/2012206467273937390

Entity相关的渲染
* 做一个文本后处理器。来处理这些在entities里的外链的渲染
    * 在entities里每个都有indices，标志着这个entity在文本中的index。可以利用这个去做渲染
* result.legacy.entities.url里还有推文里带着的外链。可以用这个去渲染外链。
    * 里面有实际的url，对应的indices，显示出来的缩短的url等等。
    * entites里有各种需要后处理的内容。比如user_mentions，hashtags。
* 可以在tweet_detail_w_entities.json里查看。https://x.com/spygea_jp/status/2011350045405356043。
    * https://t.co/YIJP7FOSPM 这个是外链。
    * https://t.co/7Wr0zKBcwQ 这个是图片
* Solution: 新建utils/entity.js来解决entity渲染

超过140字的note tweet的entity没有被渲染。

detail的文本，现在只有有entity的时候才会被处理。
但是本身文本处理都是要做的，比如处理disply range。需要修正

Hover到头像之后显示profile
* 数据已经有了，都在core里。直接显示就行
修正：
* 如果用户profile没有banner的话，渲染就直接少了一块，头像也只有下半部分了。添加针对没有banner的情况。
* 用户头像加载的图片清晰度太低，在profile card里会很模糊
* profile description需要通过和tweet文本相同的处理流程
* profile card里的name有时候会离banner非常近，主要是非英文的时候。显得很不自然。
* location的icon不太好看，改成推特的
* 不只是tweet card，在detail以及quote里也需要添加这个hover显示profile的功能
---

点击quote部分显示quote推文的detail

修改quote卡片的设计。
quote部分增加hover时高亮的效果

重新设计detail的逻辑
整体设计可以参考小红书的pc页面
* 我们点开推特卡进到detail的时候访问tweetdetail的api
    * https://x.com/i/api/graphql/_NvJCnIjOW__EP5-RF197A/TweetDetail
    * 需要的各种信息全在里面。具体有什么内容可以参考api_examples/tweet_detail_w_entities.json和api_examples/tweetdetail_w_specical_quote.json
* 点击返回能返回前一个页面。
    * 小红书能做到在同一个页面打开卡片，背景虚化，同时链接换成卡片的。点击返回直接关闭卡片，链接回到主页。
* 左边是图片，右边从上到下是原推的内容和引用推文，以及回复的推文。这样能保证图片大小稳定
    * 图片区域的大小跟着最大的图片的尺寸来，这样能保证在切换的时候图片区域大小不会变动。尺寸数据可以从media里的original_info.height original_info.width获取
* 点击图片能放大，背景虚化
* 点开card的时候有放大效果
详细api：
```
    "TweetDetail": {
      "url": "https://x.com/i/api/graphql/_NvJCnIjOW__EP5-RF197A/TweetDetail",
      "queryId": "_NvJCnIjOW__EP5-RF197A",
      "method": "GET",
      "features": {
        "rweb_video_screen_enabled": false,
        "profile_label_improvements_pcf_label_in_post_enabled": true,
        "responsive_web_profile_redirect_enabled": false,
        "rweb_tipjar_consumption_enabled": true,
        "verified_phone_label_enabled": false,
        "creator_subscriptions_tweet_preview_api_enabled": true,
        "responsive_web_graphql_timeline_navigation_enabled": true,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
        "premium_content_api_read_enabled": false,
        "communities_web_enable_tweet_community_results_fetch": true,
        "c9s_tweet_anatomy_moderator_badge_enabled": true,
        "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
        "responsive_web_grok_analyze_post_followups_enabled": false,
        "responsive_web_jetfuel_frame": true,
        "responsive_web_grok_share_attachment_enabled": true,
        "responsive_web_grok_annotations_enabled": false,
        "articles_preview_enabled": true,
        "responsive_web_edit_tweet_api_enabled": true,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
        "view_counts_everywhere_api_enabled": true,
        "longform_notetweets_consumption_enabled": true,
        "responsive_web_twitter_article_tweet_consumption_enabled": true,
        "tweet_awards_web_tipping_enabled": false,
        "responsive_web_grok_show_grok_translated_post": false,
        "responsive_web_grok_analysis_button_from_backend": true,
        "post_ctas_fetch_enabled": false,
        "creator_subscriptions_quote_tweet_preview_enabled": false,
        "freedom_of_speech_not_reach_fetch_enabled": true,
        "standardized_nudges_misinfo": true,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
        "longform_notetweets_rich_text_read_enabled": true,
        "longform_notetweets_inline_media_enabled": true,
        "responsive_web_grok_image_annotation_enabled": true,
        "responsive_web_grok_imagine_annotation_enabled": true,
        "responsive_web_grok_community_note_auto_translation_is_enabled": false,
        "responsive_web_enhance_cards_enabled": false
      }
```

hometimeline现在每次刷新之后还会显示之前的推文。
需要看看实际hometimeline的api调用的时候都带了什么参数。
* 每看一个推好像就会POST https://api.x.com/1.1/live_pipeline/update_subscriptions，在form里带上交互行为。
    * 这个是通过websocket的streaming api事实更新推文的互动数据的。[参考](https://blog.gitcode.com/a858f26c23782c9163adda2db535f25a.html)
* 感觉得研究hometimeline api

更改详情页的样式。左边图片，右边上面推文，下面是回复。
* 获得回复等信息可能需要访问TweetDetail的api

重构：
* 改成type script

去除广告。
* 在old里有带广告的example。可以用for_you_promoted来过滤

竖版排列时顺序不对
* 推特新更新的功能，点开推文之后竖版显示的顺序可能跟四宫格的时候不一样。也许有参数来指定排列顺序。

detail中的视频指定最高画质

关掉detail的时候自动关闭detail中的视频

添加translateTweet功能

GIF的视频默认播放且循环播放

使用twitter的emoji
* 利用这个库：https://github.com/jdecked/twemoji
    * 不行，发现用不了，有CSP限制访问不了外界CDN
有CSP限制不能访问外界CDN
但是我们可以用推特自己的emoji链接。推特的emoji规则是这样：
链接为：https://abs-0.twimg.com/emoji/v2/svg/1f600.svg，这个链接对应着U+1F600也就是😀这个emoji。也就是说我们要用emoji的Unicode code point（16 进制，小写）来获得对应的emoji。
复合emoji比如🇺🇸 = U+1F1FA + U+1F1F8，对应的链接则为https://abs-0.twimg.com/emoji/v2/svg/1f1fa-1f1f8.svg
但是之前的尝试全都在匹配emoji这一步失败了
和emoji相关的逻辑都放到twemoji文件里。相关的config的名字也命名为twemoji
```
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const text = "👨‍👩‍👧‍👦👍🏽🇯🇵a";
const emojis = [...segmenter.segment(text)].map(s => s.segment);
console.log(emojis);
// ["👨‍👩‍👧‍👦", "👍🏽", "🇯🇵", "a"]
```
处理emoji直接用现成的库最好。
我知道为什么parse总是出问题了，我们之前用Array.from去处理字符串，但是这种面对复合emoji的时候就失效了，依然会把复合emoji当成多个code point。
所以我们需要把这些全部换成Intl.Segmenter
https://gist.githubusercontent.com/mkkane/fcb6c686ee35b007f9b2/raw/0c5a1c435ed4fdd1068404305dd2859285a05590/emoji-dict.json
* 这个说不定也能起到作用
样式有问题
* 在推特卡里，emoji充满了一整行。detail里反而没问题
* 但是detail里emoji和emoji之间没有任何空隙，都是紧挨着的
    * 推特官方会在emoji左右两侧设置0.075em的margin，宽度和高度设置1.2em
需要修改。让推特卡和detail里都能正确显示

note tweet不只是长度超过140字的。有别的类型的也被归类为了note tweet，
比如：
* https://x.com/LilAtole/status/1961523013741887774
这种字数没有超140，但是还是有一个「显示更多」
我们需要研究一下都有哪些种类，对应进行处理

改名。waterfall比较直观
readme里加截图

文本解析还是有问题。现在如果视频来源是别人，那么带视频的推文后面都会带一个链接，而且链接没有被渲染。需要移除
* 发现display_text_range就是把这个链接带在里面的。这个链接也是个entity，在media里面。所以这个链接被渲染成视频了。