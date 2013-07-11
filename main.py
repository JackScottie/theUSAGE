#######################################################################
#######################################################################
import os
import webapp2
import jinja2
import re
import cgi
import hmac
import random
import hashlib
import string
import urllib
import urllib2
import json
import logging
import time

from google.appengine.api import memcache
from google.appengine.ext import db
from xml.dom import minidom

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
  						    autoescape = True)
								
class Handler(webapp2.RequestHandler):
	def write(self, *a, **kw):
		self.response.out.write(*a, **kw)
	def render_str(self, template, **params):
		t = jinja_env.get_template(template)
		return t.render(params)
	def render(self, template, **kw):
		self.write(self.render_str(template, **kw))


#######################################################################		
#######################################################################

#Wikipedia "books" are created using Wiki's "Book Creator" tool

class UsedFor(Handler):	  #scans saved Wikipedia "books" for usages
	def render_front(self):
		#file = [location, number of articles]
		file2 = ['static/toolbook2.txt', 181]
		file3 = ['static/toolbook3.txt', 199]
		file4 = ['static/toolbook4.txt', 137]
		file5 = ['static/toolbook5.txt', 160]		
		file6 = ['static/toolbook6.txt', 372]
		file7 = ['static/toolbook7.txt', 141]
		file8 = ['static/toolbook8.txt', 199]
		file9 = ['static/toolbook9.txt', 173]
		file10 = ['static/toolbook10.txt', 354]		
		file11 = ['static/toolbook11.txt', 290]
		file12 = ['static/toolbook12.txt', 311]
		file13 = ['static/toolbook13.txt', 314]
		file14 = ['static/toolbook14.txt', 276]		
		file15 = ['static/toolbook15.txt', 208]
		file16 = ['static/toolbook16.txt', 332]
		file17 = ['static/toolbook17.txt', 230]
		file18 = ['static/toolbook18.txt', 272]
	
		#file_list = [file2,file3,file4, file5, file6]
		#file_list = [file6,file7,file8, file9, file10]
		file_list = [file2,file3,file4,file5,file6,file7,file8,file9,file10,file11,file12,file13,file14,file15,file16,file17,file18]
		big_data=[]
		for file in file_list:
			f = open(file[0],'r') # open in read mode
			data = f.read()
			good_data = ""
			for count in range(len(data)):
				try:
					data_test = str(jinja2.escape(data[count])) #this is a test
					good_data = good_data + data[count]
				except:
					pass

			s1 = re.findall(r'[\D]+ [0-9]+', good_data)
			t_list=[]
			s2=s1[0:file[1]]
			for k in range(len(s2)):
				s3 = re.findall(r'[\D]+[a-zA-Z()]+', s2[k])
				t_list.append(s3[0])
			
			tool_position = good_data.find('Article Licenses')
			big_use_list=[]
			
			for xvar in range(len(t_list)):
				the_tool = t_list[xvar]
				the_tool = the_tool.replace('\n', '')
				tool_position = good_data.find(the_tool,tool_position)
				end_article = good_data.find('References',tool_position)
				if not end_article:
					end_article = tool_position + 2000

				case_1 = ' used'
				case_2 = 'used'
				case_3 = 'designed to'
				case_4 = 'is a tool for'
				case_5 = 'useful for' 
				case_6 = 'Usage'
				case_7 = 'meant for'
				case_8 = 'purpose of the'
				case_9 = 'function is'
				case_10 = ' uses'
				case_11 = 'They use'
				case_12 = 'is a machine'
				
				case_list = [case_1,case_2, case_3, case_4, case_5, case_6, case_7, case_8, case_9, case_10, case_11, case_12]
				best_use=None
				
				#"my_re" is the most important line of code; a Regular Expression that tries to identify uses
				my_re = re.compile(r'(?:(?:\bis a\b)|(?:\bis an\b)|(?:\bare\b))[\D]{3,33}(?:(?:\bwhich\b)|(?:\bfor\b)|(?:\bthat\b)|(?:\bto\b))[\D]+?\.')
				
				findre = my_re.search(good_data, tool_position)
				if findre:
					end_s = good_data.find('.', findre.start()) +2 #fix this 
					if findre.end() < end_s:
						best_use = findre.start()
						test =good_data[findre.start():findre.end()]
				if not best_use:
					best_use = good_data.find(case_1,tool_position)	
					test = "test failed..."
				for case in case_list:
					other_use = good_data.find(case,tool_position)
					if other_use != -1:
						if other_use < best_use:
							best_use = other_use

					use_end = good_data.find('.',best_use)
					use_sent = good_data[best_use:use_end]
					use_sent = use_sent.replace('\n', ' ')

				if best_use > end_article:
					use_sent = 'Nothing here...'
				if not use_sent:
					use_sent = 'No Results...'
				if len(use_sent) > 2000:
					use_sent = use_sent[0:140]
				packet = [the_tool, use_sent]
				big_use_list.append(packet)
							
			big_data.append(big_use_list)
		self.render("object_uses.html", big_data=big_data)
		
	def get(self):
		self.render_front()
###################################################################################################
###################################################################################################

class ToolList5(db.Model):		# database
	search_tool = db.StringProperty(required = True)
	the_tool = db.StringProperty(required = True)
	the_use = db.StringProperty(required = True)
	created = db.DateTimeProperty(auto_now_add = True)
	last_modified = db.DateTimeProperty(auto_now  =True)
		
class FindUse(Handler):        # database search
	def render_front(self, tool="", error= "", use="", is_rand=""):
		self.render("searchuse.html", tool= tool, error= error, use= use)
	
	def post(self):
		use=""
		error=""
		tool = self.request.get("tool")
		is_rand = self.request.get("is_rand")
		if tool:
			tool2 = tool.lower()
			error = ""
			use = db.GqlQuery("SELECT * FROM ToolList5 WHERE search_tool = :m_tool ORDER BY created DESC limit 1" , m_tool=tool2)
			if not use:
				error = "There were not any results."
				use=""
		else:
			if is_rand == "True":
				error = ""
				tool = get_rand_tool()
				tool2 = tool.lower()
				use = db.GqlQuery("SELECT * FROM ToolList5 WHERE search_tool = :m_tool ORDER BY created DESC limit 1" , m_tool=tool2)
				if not use:
					error = "There were not any results!"
					use=""

		self.render_front(tool,error, use)
    
	def get(self):
		self.render_front()



PAGE_RE = r'(/(?:[a-zA-Z0-9_-]+/?)*)'
app = webapp2.WSGIApplication([	('/apple-touch-icon-precomposed\.png', LogoHandleriPhone),
							    ('/favicon\.ico', Favicon),
								('/', FindUse)],
								debug=True)
