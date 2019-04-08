<script lang="ts">
	export let name: string = 'world';

	function handleChange(e) {
		name = !!e.target.value;
	}
	function printName() {
		alert(name);
	}
</script>

<h1>Hello {name}!</h1>
<input on:change={handleChange}>
<button on:click={printName}>Alert name</button>