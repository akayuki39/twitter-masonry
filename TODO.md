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

---

点击quote部分显示quote推文的detail

修改quote卡片的设计。

Entity相关的渲染
* 做一个文本后处理器。来处理这些在entities里的外链的渲染
    * 在entities里每个都有indices，标志着这个entity在文本中的index。可以利用这个去做渲染
* result.legacy.entities.url里还有推文里带着的外链。可以用这个去渲染外链。
    * entites里有各种需要后处理的内容。比如user_mentions，hashtags。
* 可以在tweet_detail_w_entities.json里查看。https://x.com/spygea_jp/status/2011350045405356043。
    * https://t.co/YIJP7FOSPM 这个是外链。
    * https://t.co/7Wr0zKBcwQ 这个是图片

而且文字显示的也不全，内容长的话后面就没了。怀疑用的text来源不对。
* 超过140个字符的属于note_tweet，在json例子里搜下
* 在详情卡里把全文显示出来

hometimeline现在每次刷新之后还会显示之前的推文。
需要看看实际hometimeline的api调用的时候都带了什么参数。
* 每看一个推好像就会POST https://api.x.com/1.1/live_pipeline/update_subscriptions，在form里带上交互行为。

更改详情页的样式。左边图片，右边上面推文，下面是回复。
* 获得回复等信息可能需要访问TweetDetail的api

重构：
* 改成type script

去除广告。
* 在old里有带广告的example。可以用for_you_promoted来过滤

竖版排列时顺序不对
* 推特新更新的功能，点开推文之后竖版显示的顺序可能跟四宫格的时候不一样。也许有参数来指定排列顺序。

推文本身是note_tweet的情况下再quote其他推文，被quote的推文不会被正确显示，而是显示unknown
* 也有的是因为quoted_status_result.result里的结构不太一样。有的是直接给result，有的需要再调用一层?.tweet才能得到正常的结果。查看tweetdetail_w_special_quote.json
    * 这个例子里被quote的推文的类型是TweetWithVisibilityResults，而不是Tweet。这个例子里是推文quote推文quote推文，最里面的不在api里显示。

detail中的视频指定最高画质

关掉detail的时候自动关闭detail中的视频

添加translateTweet功能

有时候会出现转推没有被成功渲染，而是渲染了RT的那条推特。原因暂时未知

GIF的视频默认播放且循环播放

有些emoji不能被正确显示

Hover到头像之后显示profile
* 数据已经有了，都在core里。直接显示就行