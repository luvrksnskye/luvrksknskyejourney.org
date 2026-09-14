

const dotSound = document.getElementById('dotSound');


  const timelineDots = document.querySelectorAll('.timeline-dot');

  timelineDots.forEach(dot => {
    dot.addEventListener('click', () => {

      dotSound.currentTime = 0;
      dotSound.play();
    });
  });

hcb_user = {
		comments_header : 'Make your question!',
		name_label : 'Name',
		content_label: 'Enter your comment here',
		submit : 'Comment',
		logout_link : '<img title="log out" src="https://www.htmlcommentbox.com/static/images/door_out.svg" alt="[logout]" class="hcb-icon hcb-door-out"/>',
		admin_link : '<img src="https://www.htmlcommentbox.com/static/images/door_in.svg" alt="[login]" class="hcb-icon hcb-door-in"/>',
		no_comments_msg: 'No one has commented yet. Be the first!',
		add:'Add your comment',
		again: 'Post another comment',
		rss:'<img src="https://www.htmlcommentbox.com/static/images/feed.svg" class="hcb-icon" alt="rss"/> ',
		said:'said:',
		prev_page:'<img src="/assets/images/icons/special/arrow-left.png" class="hcb-icon" title="previous page" alt="[prev]"/>',
		next_page:'<img src="/assets/images/icons/special/arrow-right.png" class="hcb-icon" title="next page" alt="[next]"/>',
		showing:'Showing',
		to:'to',
		website_label:'website (optional)',
		email_label:'email',
		anonymous:'Anonymous',
		mod_label:'(admin)',
		subscribe:'Email Me Replies',
		add_image:'Add Image',
		are_you_sure:'Do you want to flag this comment as inappropriate?',
	
		reply:'Reply',
		flag:'Flag',
		like:'Like',
	
		days_ago:'days ago',
		hours_ago:'hours ago',
		minutes_ago:'minutes ago',
		within_the_last_minute:'within the last minute',
	
		msg_thankyou:'Thank you for commenting!',
		msg_approval:'NOTE: This comment is not published until approved',
		msg_approval_required:'Thank you for commenting! Your comment will appear once approved by a moderator.',
	
		err_bad_html:'Your comment contained bad html.',
		err_bad_email:'Please enter a valid email address.',
		err_too_frequent:'You must wait a few seconds between posting comments.',
		err_comment_empty:'Your comment was not posted because it was empty!',
		err_denied:'Your comment was not accepted.',
		err_unknown:'Your comment was blocked for unknown reasons, please report this.',
		err_spam:'Your comment was detected as spam.',
		err_blocked:'Your comment was blocked by site policy.',
	
		MAX_CHARS: 8192,
		PAGE:'',
		ON_COMMENT: function(){},
		RELATIVE_DATES:true
	};
