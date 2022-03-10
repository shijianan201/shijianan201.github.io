---
layout: page
title: "友情链接"
description: "友情链接"
group: navigation
---

<h2 id="friends" itemprop="about">友情链接</h2>

<ul>
{% for friend in site.data.friends %}
  <li>
    <a href="{{ friend.url }}">
      {{ friend.name }}
    </a>
  </li>
{% endfor %}
</ul>
