# CONTRIBUTING

There aren't many rules or guidlines on contributing at the moment, but the ones that do exist are shown below.

1. The requirements are as follows:

	1. The code must be in typescript
	2. The code must compile
	3. The code must work (or at least appear to function)
	4. Variables CANNOT be typed as **any**<sup>1</sup>

2. The standard/style:

	1. Indentation of 6 spaces
	2. Block statements
		a. Spaces before condition


		```javascript
		if (true) {}      ✅
		if(helloThere){}  ❌
		```

		b. Curly braces formatting

		```javascript
		if (true) {       ✅
			return 1;
		}
		else {
			return 0;
		}
		if (true) {       ✅
			return 1 ;
		} else {
			return 0;
		}
		```

		Either way works just fine. So long as this does not happen.

		```javascript
		if (true)         ❌
		{
			return "why";	
		} else
		{
			return "dont";
		}
		```

	3. Semicolons;
	4. Readable thing.dothing().then(()=>{print("hello world");}).catch(err=>{print(`red alert ${err}`);});

		```javascript
		thing.dothing()
		    .then(() => {
		        print("hello world");
		    })
		    .catch(err => {
		        print(`red alert ${err}`);
		    });
		```

<sup>1.</sup> Provided that the entire codebase doesn't expload without it. But then I think I'd rather have that happen than to see `as any` anywhere

# LINTER

There's a linter, with its relevant config file, that enforces coding styles. It's not necessary to pass it to compile or submit patches, but it would be nice if you checked it with `npm run lint` before submitting a MR :)
Even if your code doesn't quite fit with these styles it would be accepted if it's good code. The linter is mainly here so that I don't follow a different standard for each function... It also tells you if what you're doing sucks (sometimes).

There were several hundred linter errors when I first enforced the linter. They were all very easy to fix (apart from one). So don't stress if you can't get it right the first time- I certainly didn't.

The one issue that I couldn't fix is something I refuse to touch.

```sh
/home/allison/Repos/discord-term/src/events.ts
  82:17  warning  Forbidden non-null assertion  @typescript-eslint/no-non-null-assertion

✖ 1 problem (0 errors, 1 warning)
```

I'm not going to pretend to know what half those words mean. 
<sup>feel free to fix :)</sup>
