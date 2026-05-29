---
layout: page
title: "Friends"
description: "Friends"
---

<h2 id="friends" itemprop="about">Friends</h2>

<ul>
{% for friend in site.data.friends %}
  <li>
    <a href="{{ friend.url }}">
      {{ friend.name }}
    </a>
  </li>
{% endfor %}
</ul>
